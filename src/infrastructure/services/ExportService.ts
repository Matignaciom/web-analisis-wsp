import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { Conversation, AnalysisResult, DashboardMetrics } from '@/domain/entities'

export interface ExportData {
  conversations: Conversation[]
  analysisResults?: AnalysisResult[]
  metrics?: DashboardMetrics
}

export interface ExportOptions {
  includeCharts?: boolean
  includeAnalysis?: boolean
  includeMetrics?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
}

export class ExportService {
  
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  async exportToPDF(data: ExportData, options: ExportOptions = {}): Promise<Blob> {
    const pdf = new jsPDF()
    let yPosition = 20

    // Configuración inicial
    pdf.setFontSize(20)
    pdf.text('Reporte de Analisis de Conversaciones WhatsApp', 20, yPosition)
    yPosition += 15

    pdf.setFontSize(10)
    pdf.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 20, yPosition)
    yPosition += 20

    // Métricas generales si están disponibles
    if (options.includeMetrics && data.metrics) {
      yPosition = this.addMetricsToPDF(pdf, data.metrics, yPosition)
    }

    // Tabla de conversaciones
    yPosition = this.addConversationsTableToPDF(pdf, data.conversations, yPosition)

    // Análisis de resultados si están disponibles
    if (options.includeAnalysis && data.analysisResults) {
      yPosition = this.addAnalysisTableToPDF(pdf, data.analysisResults, yPosition)
    }

    // Resumen y recomendaciones
    this.addSummaryToPDF(pdf, data, yPosition)

    return new Blob([pdf.output('blob')], { type: 'application/pdf' })
  }

  async exportToExcel(data: ExportData, options: ExportOptions = {}): Promise<Blob> {
    const workbook = XLSX.utils.book_new()

    // Hoja 1: Conversaciones
    const conversationsWS = this.createConversationsWorksheet(data.conversations)
    XLSX.utils.book_append_sheet(workbook, conversationsWS, 'Conversaciones')

    // Hoja 2: Métricas (si están disponibles)
    if (options.includeMetrics && data.metrics) {
      const metricsWS = this.createMetricsWorksheet(data.metrics)
      XLSX.utils.book_append_sheet(workbook, metricsWS, 'Métricas')
    }

    // Hoja 3: Análisis de IA (si están disponibles)
    if (options.includeAnalysis && data.analysisResults) {
      const analysisWS = this.createAnalysisWorksheet(data.analysisResults)
      XLSX.utils.book_append_sheet(workbook, analysisWS, 'Análisis IA')
    }

    // Hoja 4: Resumen ejecutivo
    const summaryWS = this.createSummaryWorksheet(data)
    XLSX.utils.book_append_sheet(workbook, summaryWS, 'Resumen')

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  }

  private addMetricsToPDF(pdf: jsPDF, metrics: DashboardMetrics, yPosition: number): number {
    pdf.setFontSize(16)
    pdf.text('METRICAS GENERALES', 20, yPosition)
    yPosition += 15

    const metricsData = [
      ['Total Conversaciones', metrics.totalConversations.toString()],
      ['Ventas Completadas', metrics.completedSales.toString()],
      ['Chats Abandonados', metrics.abandonedChats.toString()],
      ['Tiempo Promedio Respuesta', metrics.averageResponseTime],
      ['Tasa de Conversion', `${(metrics.conversionRate * 100).toFixed(1)}%`],
      ['Puntuacion Satisfaccion', `${metrics.satisfactionScore.toFixed(1)}/5`]
    ]

    autoTable(pdf, {
      startY: yPosition,
      head: [['Metrica', 'Valor']],
      body: metricsData,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [52, 152, 219] },
      margin: { left: 20 }
    })

    return (pdf as any).lastAutoTable.finalY + 20
  }

  private addConversationsTableToPDF(pdf: jsPDF, conversations: Conversation[], yPosition: number): number {
    pdf.setFontSize(16)
    pdf.text('LISTA DE CONVERSACIONES', 20, yPosition)
    yPosition += 15

    const conversationsData = conversations.map(conv => [
      conv.customerName,
      conv.customerPhone,
      this.getStatusLabelForPDF(conv.status),
      conv.totalMessages.toString(),
      conv.startDate.toLocaleDateString('es-ES'),
      conv.assignedAgent || 'Sin asignar',
      this.truncateText(conv.lastMessage, 30)
    ])

    autoTable(pdf, {
      startY: yPosition,
      head: [['Cliente', 'Telefono', 'Estado', 'Mensajes', 'Fecha', 'Agente', 'Ultimo Mensaje']],
      body: conversationsData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [46, 204, 113] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
        3: { cellWidth: 15 },
        4: { cellWidth: 20 },
        5: { cellWidth: 25 },
        6: { cellWidth: 40 }
      },
      margin: { left: 20 }
    })

    return (pdf as any).lastAutoTable.finalY + 20
  }

  private addAnalysisTableToPDF(pdf: jsPDF, analysisResults: AnalysisResult[], yPosition: number): number {
    if (yPosition > 250) {
      pdf.addPage()
      yPosition = 20
    }

    pdf.setFontSize(16)
    pdf.text('ANALISIS DE IA', 20, yPosition)
    yPosition += 15

    const analysisData = analysisResults.map(result => [
      result.conversationId.substring(0, 8) + '...',
      this.getSentimentLabelForPDF(result.sentiment.label),
      result.intent.primary.type,
      `${(result.confidence * 100).toFixed(0)}%`,
      this.truncateText(result.summary, 40)
    ])

    autoTable(pdf, {
      startY: yPosition,
      head: [['ID Conv.', 'Sentimiento', 'Intencion', 'Confianza', 'Resumen']],
      body: analysisData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [155, 89, 182] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 20 },
        4: { cellWidth: 70 }
      },
      margin: { left: 20 }
    })

    return (pdf as any).lastAutoTable.finalY + 20
  }

  private addSummaryToPDF(pdf: jsPDF, data: ExportData, yPosition: number): void {
    if (yPosition > 250) {
      pdf.addPage()
      yPosition = 20
    }

    pdf.setFontSize(16)
    pdf.text('RESUMEN EJECUTIVO', 20, yPosition)
    yPosition += 15

    pdf.setFontSize(12)
    const totalConversations = data.conversations.length
    const completedConversations = data.conversations.filter(c => c.status === 'completed').length
    const averageMessages = totalConversations > 0 ? 
      Math.round(data.conversations.reduce((acc, c) => acc + c.totalMessages, 0) / totalConversations) : 0

    const summaryText = [
      `* Total de conversaciones analizadas: ${totalConversations}`,
      `* Conversaciones completadas: ${completedConversations} (${((completedConversations/totalConversations)*100).toFixed(1)}%)`,
      `* Promedio de mensajes por conversacion: ${averageMessages}`,
      `* Periodo analizado: ${data.conversations[0]?.startDate.toLocaleDateString('es-ES')} - ${data.conversations[data.conversations.length-1]?.startDate.toLocaleDateString('es-ES')}`,
      '',
      'RECOMENDACIONES:',
      '* Implementar respuestas automaticas para consultas frecuentes',
      '* Capacitar agentes en manejo de objeciones',
      '* Optimizar tiempo de respuesta en horarios pico',
      '* Analizar patrones de abandono para mejorar retencion',
      '* Establecer KPIs de satisfaccion por agente'
    ]

    summaryText.forEach((line, index) => {
      pdf.text(line, 20, yPosition + (index * 8))
    })
  }

  private createConversationsWorksheet(conversations: Conversation[]): XLSX.WorkSheet {
    const data = conversations.map(conv => ({
      'ID': conv.id,
      'Cliente': conv.customerName,
      'Teléfono': conv.customerPhone,
      'Estado': this.getStatusLabel(conv.status),
      'Total Mensajes': conv.totalMessages,
      'Fecha Inicio': conv.startDate.toLocaleDateString('es-ES'),
      'Fecha Fin': conv.endDate?.toLocaleDateString('es-ES') || 'N/A',
      'Agente Asignado': conv.assignedAgent || 'Sin asignar',
      'Último Mensaje': conv.lastMessage,
      'Tiempo Respuesta (min)': conv.metadata.responseTime,
      'Satisfacción': conv.metadata.satisfaction || 'N/A',
      'Valor Compra': conv.metadata.totalPurchaseValue ? this.formatCurrency(conv.metadata.totalPurchaseValue) : 'N/A',
      'Fuente': conv.metadata.source,
      'Etiquetas': conv.tags.join(', ')
    }))

    return XLSX.utils.json_to_sheet(data)
  }

  private createMetricsWorksheet(metrics: DashboardMetrics): XLSX.WorkSheet {
    const data = [
      ['Métrica', 'Valor'],
      ['Total Conversaciones', metrics.totalConversations],
      ['Ventas Completadas', metrics.completedSales],
      ['Chats Abandonados', metrics.abandonedChats],
      ['Tiempo Promedio Respuesta', metrics.averageResponseTime],
      ['Tasa de Conversión', `${(metrics.conversionRate * 100).toFixed(1)}%`],
      ['Puntuación Satisfacción', `${metrics.satisfactionScore.toFixed(1)}/5`],
      ['', ''],
      ['Desglose por Estado', ''],
      ['Pendientes', metrics.statusBreakdown?.pending || 0],
      ['En Progreso', metrics.statusBreakdown?.inProgress || 0],
      ['Completados', metrics.statusBreakdown?.completed || 0],
      ['Cancelados', metrics.statusBreakdown?.cancelled || 0]
    ]

    return XLSX.utils.aoa_to_sheet(data)
  }

  private createAnalysisWorksheet(analysisResults: AnalysisResult[]): XLSX.WorkSheet {
    const data = analysisResults.map(result => ({
      'ID Conversación': result.conversationId,
      'Timestamp': result.timestamp.toLocaleString('es-ES'),
      'Sentimiento': this.getSentimentLabel(result.sentiment.label),
      'Puntuación Sentimiento': result.sentiment.score.toFixed(2),
      'Confianza Sentimiento': `${(result.sentiment.confidence * 100).toFixed(1)}%`,
      'Intención Principal': result.intent.primary.type,
      'Categoría Intención': result.intent.primary.category,
      'Confianza Intención': `${(result.intent.primary.confidence * 100).toFixed(1)}%`,
      'Resumen': result.summary,
      'Insights Clave': result.keyInsights.join('; '),
      'Recomendaciones': result.recommendations.join('; '),
      'Confianza General': `${(result.confidence * 100).toFixed(1)}%`,
      'Palabras Clave': result.sentiment.keywords.join(', ')
    }))

    return XLSX.utils.json_to_sheet(data)
  }

  private createSummaryWorksheet(data: ExportData): XLSX.WorkSheet {
    const totalConversations = data.conversations.length
    const completedConversations = data.conversations.filter(c => c.status === 'completed').length
    const abandonedConversations = data.conversations.filter(c => c.status === 'abandoned').length
    const activeConversations = data.conversations.filter(c => c.status === 'active').length
    const pendingConversations = data.conversations.filter(c => c.status === 'pending').length

    const averageMessages = totalConversations > 0 ? 
      Math.round(data.conversations.reduce((acc, c) => acc + c.totalMessages, 0) / totalConversations) : 0

    const avgResponseTime = totalConversations > 0 ?
      Math.round(data.conversations.reduce((acc, c) => acc + c.metadata.responseTime, 0) / totalConversations) : 0

    const summaryData = [
      ['RESUMEN EJECUTIVO'],
      [''],
      ['Métricas Generales', ''],
      ['Total Conversaciones', totalConversations],
      ['Conversaciones Completadas', completedConversations],
      ['Conversaciones Abandonadas', abandonedConversations],
      ['Conversaciones Activas', activeConversations],
      ['Conversaciones Pendientes', pendingConversations],
      [''],
      ['Promedios', ''],
      ['Mensajes por Conversación', averageMessages],
      ['Tiempo de Respuesta (min)', avgResponseTime],
      [''],
      ['Porcentajes', ''],
      ['Tasa de Conversión', `${((completedConversations/totalConversations)*100).toFixed(1)}%`],
      ['Tasa de Abandono', `${((abandonedConversations/totalConversations)*100).toFixed(1)}%`],
      [''],
      ['Periodo Analizado', ''],
      ['Fecha Inicio', data.conversations[0]?.startDate.toLocaleDateString('es-ES') || 'N/A'],
      ['Fecha Fin', data.conversations[data.conversations.length-1]?.startDate.toLocaleDateString('es-ES') || 'N/A'],
      [''],
      ['Recomendaciones', ''],
      ['1', 'Implementar respuestas automáticas para consultas frecuentes'],
      ['2', 'Capacitar agentes en manejo de objeciones'],
      ['3', 'Optimizar tiempo de respuesta en horarios pico'],
      ['4', 'Analizar patrones de abandono para mejorar retención'],
      ['5', 'Establecer KPIs de satisfacción por agente']
    ]

    return XLSX.utils.aoa_to_sheet(summaryData)
  }

  // Versiones para PDF sin emojis
  private getStatusLabelForPDF(status: string): string {
    const statusMap: Record<string, string> = {
      'active': 'ACTIVO',
      'completed': 'COMPLETADO',
      'abandoned': 'ABANDONADO',
      'pending': 'PENDIENTE'
    }
    return statusMap[status] || status.toUpperCase()
  }

  private getSentimentLabelForPDF(label: string): string {
    const sentimentMap: Record<string, string> = {
      'very_positive': 'MUY POSITIVO',
      'positive': 'POSITIVO',
      'neutral': 'NEUTRAL',
      'negative': 'NEGATIVO',
      'very_negative': 'MUY NEGATIVO'
    }
    return sentimentMap[label] || label.toUpperCase()
  }

  // Versiones para Excel con emojis (se mantienen igual)
  private getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'active': '🟢 Activo',
      'completed': '✅ Completado',
      'abandoned': '🔴 Abandonado',
      'pending': '⏳ Pendiente'
    }
    return statusMap[status] || status
  }

  private getSentimentLabel(label: string): string {
    const sentimentMap: Record<string, string> = {
      'very_positive': '😍 Muy Positivo',
      'positive': '😊 Positivo',
      'neutral': '😐 Neutral',
      'negative': '😞 Negativo',
      'very_negative': '😡 Muy Negativo'
    }
    return sentimentMap[label] || label
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + '...'
  }
}

export const exportService = new ExportService() 