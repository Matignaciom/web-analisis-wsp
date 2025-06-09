import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { Conversation, AnalysisResult, DashboardMetrics } from '@/domain/entities'

export interface ExportData {
  conversations: Conversation[]
  analysisResults?: AnalysisResult[]
  metrics?: DashboardMetrics
  dynamicMetrics?: any[]
  aiInsights?: {
    summary: string
    keyFindings: string[]
    recommendations: string[]
  }
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

    // Hoja 4: Métricas dinámicas (si están disponibles)
    if (options.includeCharts && data.dynamicMetrics && data.dynamicMetrics.length > 0) {
      const dynamicMetricsWS = this.createDynamicMetricsWorksheet(data.dynamicMetrics)
      XLSX.utils.book_append_sheet(workbook, dynamicMetricsWS, 'Métricas Dinámicas')
    }

    // Hoja 5: Resumen ejecutivo
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
    if (yPosition > 240) {
      pdf.addPage()
      yPosition = 20
    }

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
      head: [['Cliente', 'Telefono', 'Estado', 'Msgs', 'Fecha', 'Agente', 'Ultimo Mensaje']],
      body: conversationsData,
      styles: { 
        fontSize: 7,
        cellPadding: 2,
        overflow: 'linebreak',
        halign: 'left'
      },
      headStyles: { 
        fillColor: [46, 204, 113],
        fontSize: 8,
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 18 },  // Cliente - reducido de 22 a 18
        1: { cellWidth: 16 },  // Teléfono - reducido de 20 a 16
        2: { cellWidth: 16 },  // Estado - reducido de 18 a 16
        3: { cellWidth: 10 },  // Mensajes - reducido de 12 a 10
        4: { cellWidth: 16 },  // Fecha - reducido de 18 a 16
        5: { cellWidth: 18 },  // Agente - reducido de 20 a 18
        6: { cellWidth: 30 }   // Último Mensaje - reducido de 35 a 30
      },
      margin: { left: 20, right: 20 },
      tableWidth: 'wrap'
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
      result.conversationId.substring(0, 6) + '...',
      this.getSentimentLabelForPDF(result.sentiment.label),
      result.intent.primary.type,
      `${(result.confidence * 100).toFixed(0)}%`,
      this.truncateText(result.summary, 35)
    ])

    autoTable(pdf, {
      startY: yPosition,
      head: [['ID Conv.', 'Sentimiento', 'Intencion', 'Conf.', 'Resumen']],
      body: analysisData,
      styles: { 
        fontSize: 7,
        cellPadding: 2,
        overflow: 'linebreak',
        halign: 'left'
      },
      headStyles: { 
        fillColor: [155, 89, 182],
        fontSize: 8,
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 18 },  // ID Conversación - reducido de 20 a 18
        1: { cellWidth: 20 },  // Sentimiento - reducido de 22 a 20
        2: { cellWidth: 22 },  // Intención - reducido de 25 a 22
        3: { cellWidth: 12 },  // Confianza - reducido de 15 a 12
        4: { cellWidth: 52 }   // Resumen - reducido de 63 a 52
      },
      margin: { left: 20, right: 20 },
      tableWidth: 'wrap'
    })

    return (pdf as any).lastAutoTable.finalY + 20
  }

  private addSummaryToPDF(pdf: jsPDF, data: ExportData, yPosition: number): void {
    if (yPosition > 250) {
      pdf.addPage()
      yPosition = 20
    }

    pdf.setFontSize(16)
    pdf.text('RESUMEN EJECUTIVO CON ANALISIS IA', 20, yPosition)
    yPosition += 15

    pdf.setFontSize(12)
    const totalConversations = data.conversations.length
    const completedConversations = data.conversations.filter(c => c.status === 'completed').length
    const averageMessages = totalConversations > 0 ? 
      Math.round(data.conversations.reduce((acc, c) => acc + c.totalMessages, 0) / totalConversations) : 0
    const withAIAnalysis = data.conversations.filter(c => c.aiSummary || c.aiSuggestion).length

    let summaryText = [
      `* Total de conversaciones analizadas: ${totalConversations}`,
      `* Conversaciones completadas: ${completedConversations} (${((completedConversations/totalConversations)*100).toFixed(1)}%)`,
      `* Conversaciones con analisis IA: ${withAIAnalysis} (${((withAIAnalysis/totalConversations)*100).toFixed(1)}%)`,
      `* Promedio de mensajes por conversacion: ${averageMessages}`,
      `* Periodo analizado: ${data.conversations[0]?.startDate.toLocaleDateString('es-ES')} - ${data.conversations[data.conversations.length-1]?.startDate.toLocaleDateString('es-ES')}`,
      ''
    ]

    // Agregar insights de IA si están disponibles
    if (data.aiInsights) {
      summaryText.push('RESUMEN INTELIGENTE:')
      summaryText.push(`${data.aiInsights.summary}`)
      summaryText.push('')
      
      summaryText.push('HALLAZGOS CLAVE:')
      data.aiInsights.keyFindings.forEach(finding => {
        summaryText.push(`* ${finding}`)
      })
      summaryText.push('')

      summaryText.push('RECOMENDACIONES IA:')
      data.aiInsights.recommendations.forEach(recommendation => {
        summaryText.push(`* ${recommendation}`)
      })
    } else {
      summaryText.push('RECOMENDACIONES GENERALES:')
      summaryText.push('* Implementar respuestas automaticas para consultas frecuentes')
      summaryText.push('* Capacitar agentes en manejo de objeciones')
      summaryText.push('* Optimizar tiempo de respuesta en horarios pico')
      summaryText.push('* Analizar patrones de abandono para mejorar retencion')
      summaryText.push('* Establecer KPIs de satisfaccion por agente')
    }

    // Agregar métricas dinámicas si están disponibles
    if (data.dynamicMetrics && data.dynamicMetrics.length > 0) {
      summaryText.push('')
      summaryText.push('METRICAS DINAMICAS DESTACADAS:')
      data.dynamicMetrics.slice(0, 5).forEach(metric => {
        summaryText.push(`* ${metric.title}: ${metric.value} (${metric.category || 'General'})`)
      })
    }

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
      '🤖 Interés Detectado (IA)': conv.interest || 'No analizado',
      '🎯 Potencial de Venta (IA)': conv.salesPotential ? `${conv.salesPotential.toUpperCase()}` : 'No evaluado',
      '📝 Resumen IA': conv.aiSummary || 'No disponible',
      '💡 Sugerencia IA': conv.aiSuggestion || 'No disponible',
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

  private createDynamicMetricsWorksheet(dynamicMetrics: any[]): XLSX.WorkSheet {
    const data = dynamicMetrics.map(metric => ({
      'Métrica': metric.title,
      'Valor': metric.value,
      'Tipo': metric.type,
      'Categoría': metric.category || 'General',
      'Icono': metric.icon || '',
      'Tendencia': metric.trend ? `${metric.trend.direction === 'up' ? '↗️' : metric.trend.direction === 'down' ? '↘️' : '➡️'} ${metric.trend.value}%` : 'N/A',
      'Generado por IA': metric.aiGenerated ? '✅ Sí' : '❌ No'
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

    const withAIAnalysis = data.conversations.filter(c => c.aiSummary || c.aiSuggestion).length

    let summaryData = [
      ['RESUMEN EJECUTIVO CON ANÁLISIS IA'],
      [''],
      ['Métricas Generales', ''],
      ['Total Conversaciones', totalConversations],
      ['Conversaciones Completadas', completedConversations],
      ['Conversaciones Abandonadas', abandonedConversations],
      ['Conversaciones Activas', activeConversations],
      ['Conversaciones Pendientes', pendingConversations],
      ['Conversaciones con Análisis IA', withAIAnalysis],
      [''],
      ['Promedios', ''],
      ['Mensajes por Conversación', averageMessages],
      ['Tiempo de Respuesta (min)', avgResponseTime],
      [''],
      ['Porcentajes', ''],
      ['Tasa de Conversión', `${((completedConversations/totalConversations)*100).toFixed(1)}%`],
      ['Tasa de Abandono', `${((abandonedConversations/totalConversations)*100).toFixed(1)}%`],
      ['Cobertura Análisis IA', `${((withAIAnalysis/totalConversations)*100).toFixed(1)}%`],
      [''],
      ['Periodo Analizado', ''],
      ['Fecha Inicio', data.conversations[0]?.startDate.toLocaleDateString('es-ES') || 'N/A'],
      ['Fecha Fin', data.conversations[data.conversations.length-1]?.startDate.toLocaleDateString('es-ES') || 'N/A'],
      ['']
    ]

    // Agregar insights de IA si están disponibles
    if (data.aiInsights) {
      summaryData.push(['🤖 RESUMEN INTELIGENTE', ''])
      summaryData.push([data.aiInsights.summary, ''])
      summaryData.push(['', ''])
      
      summaryData.push(['🔍 HALLAZGOS CLAVE', ''])
      data.aiInsights.keyFindings.forEach((finding, index) => {
        summaryData.push([`${index + 1}`, finding])
      })
      summaryData.push(['', ''])

      summaryData.push(['💡 RECOMENDACIONES IA', ''])
      data.aiInsights.recommendations.forEach((recommendation, index) => {
        summaryData.push([`${index + 1}`, recommendation])
      })
    } else {
      summaryData.push(['Recomendaciones Generales', ''])
      summaryData.push(['1', 'Implementar respuestas automáticas para consultas frecuentes'])
      summaryData.push(['2', 'Capacitar agentes en manejo de objeciones'])
      summaryData.push(['3', 'Optimizar tiempo de respuesta en horarios pico'])
      summaryData.push(['4', 'Analizar patrones de abandono para mejorar retención'])
      summaryData.push(['5', 'Establecer KPIs de satisfacción por agente'])
    }

    // Agregar métricas dinámicas destacadas
    if (data.dynamicMetrics && data.dynamicMetrics.length > 0) {
      summaryData.push(['', ''])
      summaryData.push(['📊 MÉTRICAS DINÁMICAS DESTACADAS', ''])
      data.dynamicMetrics.slice(0, 5).forEach(metric => {
        summaryData.push([metric.title, `${metric.value} (${metric.category || 'General'})`])
      })
    }

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