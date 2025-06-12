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

  // Función para localizar tipos de métricas al español
  private localizeMetricType(type: string): string {
    const typeMap: Record<string, string> = {
      'number': 'Número',
      'percentage': 'Porcentaje',
      'currency': 'Moneda',
      'text': 'Texto',
      'time': 'Tiempo'
    }
    return typeMap[type] || type
  }

  // Función para mejorar las tendencias
  private formatTrend(trend: any): string {
    if (!trend || !trend.direction || trend.value === undefined || trend.value === null) {
      return 'Sin tendencia'
    }
    
    const directions = {
      'up': 'Subida',
      'down': 'Bajada', 
      'neutral': 'Estable'
    }
    
    const directionText = directions[trend.direction as keyof typeof directions] || 'Estable'
    return `${directionText} ${trend.value}%`
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

    // Métricas dinámicas de rendimiento si están disponibles
    if (options.includeCharts && data.dynamicMetrics && data.dynamicMetrics.length > 0) {
      yPosition = this.addDynamicMetricsToPDF(pdf, data.dynamicMetrics, yPosition)
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
    if (yPosition > 240) {
      pdf.addPage()
      yPosition = 20
    }

    pdf.setFontSize(14)
    pdf.text('METRICAS DE RENDIMIENTO', 20, yPosition)
    yPosition += 15

    const metricsData = [
      ['Total Conversaciones', metrics.totalConversations.toString()],
      ['Ventas Completadas', metrics.completedSales.toString()],
      ['Chats Abandonados', metrics.abandonedChats.toString()],
      ['Tiempo Promedio Respuesta', metrics.averageResponseTime.toString()],
      ['Tasa de Conversion', `${metrics.conversionRate.toFixed(1)}%`],
      ['Puntuacion Satisfaccion', `${metrics.satisfactionScore.toFixed(1)}/5`],
    ]

    autoTable(pdf, {
      startY: yPosition,
      body: metricsData,
      styles: { 
        fontSize: 9,
        cellPadding: 4,
        overflow: 'linebreak',
        lineWidth: 0.1,
        halign: 'left',
        valign: 'top'
      },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold', valign: 'top' },
        1: { cellWidth: 50, halign: 'right', valign: 'top' }
      },
      margin: { left: 20, right: 20 },
      tableWidth: 'auto',
      didParseCell: (hookData) => {
        if (hookData.section === 'body') {
          hookData.cell.styles.minCellHeight = 10
        }
      }
    })

    return (pdf as any).lastAutoTable.finalY + 15
  }

  private addDynamicMetricsToPDF(pdf: jsPDF, dynamicMetrics: any[], yPosition: number): number {
    if (yPosition > 230) {
      pdf.addPage()
      yPosition = 20
    }

    pdf.setFontSize(14)
    pdf.text('METRICAS DINAMICAS - ANALISIS IA', 20, yPosition)
    yPosition += 15

    const metricsData = dynamicMetrics.slice(0, 10).map(metric => [
      this.cleanTextForPDF(metric.title),
      this.cleanTextForPDF(metric.value),
      this.localizeMetricType(metric.type),
      metric.category || 'General',
      this.formatTrend(metric.trend)
    ])

    autoTable(pdf, {
      startY: yPosition,
      head: [['Métrica', 'Valor', 'Tipo', 'Categoría', 'Tendencia']],
      body: metricsData,
      styles: { 
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        lineWidth: 0.1,
        halign: 'left',
        valign: 'top'
      },
      headStyles: { 
        fillColor: [16, 185, 129],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8
      },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold', valign: 'top' },
        1: { cellWidth: 35, halign: 'center', valign: 'top' },
        2: { cellWidth: 25, valign: 'top' },
        3: { cellWidth: 30, valign: 'top' },
        4: { cellWidth: 30, halign: 'center', valign: 'top' }
      },
      margin: { left: 20, right: 20 },
      tableWidth: 'auto',
      didParseCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 0) {
          // Asegurar altura mínima para el título de la métrica
          hookData.cell.styles.minCellHeight = 10
        }
      }
    })

    return (pdf as any).lastAutoTable.finalY + 15
  }

  private addConversationsTableToPDF(pdf: jsPDF, conversations: Conversation[], yPosition: number): number {
    if (yPosition > 240) {
      pdf.addPage()
      yPosition = 20
    }

    pdf.setFontSize(14)
    pdf.text('LISTA DE CONVERSACIONES ANALIZADAS', 20, yPosition)
    yPosition += 15

    const conversationsData = conversations.slice(0, 20).map(conv => [
      this.cleanTextForPDF(conv.id),
      this.cleanTextForPDF(conv.customerName),
      this.cleanTextForPDF(conv.customerPhone),
      this.getStatusLabelForPDF(conv.status as string),
      conv.totalMessages.toString(),
      this.cleanTextForPDF(conv.lastMessage)
    ])

    autoTable(pdf, {
      startY: yPosition,
      head: [['ID', 'Cliente', 'Teléfono', 'Estado', 'Mensajes', 'Último Mensaje']],
      body: conversationsData,
      styles: { 
        fontSize: 7,
        cellPadding: 3,
        overflow: 'linebreak',
        lineWidth: 0.1,
        halign: 'left',
        valign: 'top'
      },
      headStyles: { 
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8
      },
      columnStyles: {
        0: { cellWidth: 20, valign: 'top' },
        1: { cellWidth: 30, valign: 'top' },
        2: { cellWidth: 25, valign: 'top' },
        3: { cellWidth: 20, valign: 'top' },
        4: { cellWidth: 12, halign: 'center', valign: 'top' },
        5: { cellWidth: 53, valign: 'top' }
      },
      margin: { left: 20, right: 20 },
      tableWidth: 'auto',
      didParseCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 5) {
          // Asegurar altura mínima para el último mensaje
          hookData.cell.styles.minCellHeight = 12
        }
      }
    })

    return (pdf as any).lastAutoTable.finalY + 10
  }

  private addAnalysisTableToPDF(pdf: jsPDF, analysisResults: AnalysisResult[], yPosition: number): number {
    if (yPosition > 240) {
      pdf.addPage()
      yPosition = 20
    }

    pdf.setFontSize(14)
    pdf.text('ANALISIS DETALLADO DE IA', 20, yPosition)
    yPosition += 15

    const analysisData = analysisResults.slice(0, 15).map(result => [
      this.cleanTextForPDF(result.conversationId),
      this.getSentimentLabelForPDF(result.sentiment.label),
      `${(result.sentiment.confidence * 100).toFixed(0)}%`,
      this.cleanTextForPDF(result.intent.primary.type),
      `${(result.intent.primary.confidence * 100).toFixed(0)}%`,
      this.cleanTextForPDF(result.summary)
    ])

    autoTable(pdf, {
      startY: yPosition,
      head: [['ID Conv.', 'Sentimiento', 'Conf.', 'Intención', 'Conf.', 'Resumen IA']],
      body: analysisData,
      styles: { 
        fontSize: 7,
        cellPadding: 3,
        overflow: 'linebreak',
        lineWidth: 0.1,
        halign: 'left',
        valign: 'top'
      },
      headStyles: { 
        fillColor: [139, 92, 246],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8
      },
      columnStyles: {
        0: { cellWidth: 20, valign: 'top' },
        1: { cellWidth: 25, valign: 'top' },
        2: { cellWidth: 12, halign: 'center', valign: 'top' },
        3: { cellWidth: 25, valign: 'top' },
        4: { cellWidth: 12, halign: 'center', valign: 'top' },
        5: { cellWidth: 66, valign: 'top' }
      },
      margin: { left: 20, right: 20 },
      tableWidth: 'auto',
      didParseCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 5) {
          // Asegurar altura mínima para el resumen
          hookData.cell.styles.minCellHeight = 12
        }
      }
    })

    return (pdf as any).lastAutoTable.finalY + 10
  }

  private addSummaryToPDF(pdf: jsPDF, data: ExportData, yPosition: number): void {
    if (yPosition > 250) {
      pdf.addPage()
      yPosition = 20
    }

    pdf.setFontSize(16)
    pdf.text('RESUMEN EJECUTIVO CON ANALISIS IA', 20, yPosition)
    yPosition += 20

    const totalConversations = data.conversations.length
    // Corregir el filtro para usar los valores correctos de status
    const completedConversations = data.conversations.filter(c => 
      (c.status as any) === 'completed' || 
      (c.status as any) === 'COMPLETED'
    ).length
    const averageMessages = totalConversations > 0 ? 
      Math.round(data.conversations.reduce((acc, c) => acc + c.totalMessages, 0) / totalConversations) : 0
    const withAIAnalysis = data.conversations.filter(c => c.aiSummary || c.aiSuggestion).length

    // Usar autoTable para el resumen básico para evitar superposiciones
    const basicSummaryData = [
      ['Total de conversaciones analizadas', totalConversations.toString()],
      ['Conversaciones completadas', `${completedConversations} (${totalConversations > 0 ? ((completedConversations/totalConversations)*100).toFixed(1) : '0.0'}%)`],
      ['Conversaciones con analisis IA', `${withAIAnalysis} (${totalConversations > 0 ? ((withAIAnalysis/totalConversations)*100).toFixed(1) : '0.0'}%)`],
      ['Promedio de mensajes por conversacion', averageMessages.toString()],
      ['Periodo analizado', `${data.conversations[0]?.startDate.toLocaleDateString('es-ES') || 'N/A'} - ${data.conversations[data.conversations.length-1]?.startDate.toLocaleDateString('es-ES') || 'N/A'}`]
    ]

    autoTable(pdf, {
      startY: yPosition,
      body: basicSummaryData,
      styles: { 
        fontSize: 9,
        cellPadding: 4,
        overflow: 'linebreak',
        lineWidth: 0.1,
        halign: 'left',
        valign: 'top'
      },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold', valign: 'top' },
        1: { cellWidth: 80, valign: 'top' }
      },
      margin: { left: 20, right: 20 },
      tableWidth: 'auto',
      didParseCell: (hookData) => {
        // Asegurar altura mínima para evitar superposiciones
        if (hookData.section === 'body') {
          const text = hookData.cell.raw as string
          if (text && text.length > 50) {
            hookData.cell.styles.minCellHeight = 15
          }
        }
      }
    })

    yPosition = (pdf as any).lastAutoTable.finalY + 20

    // Agregar insights de IA si están disponibles
    if (data.aiInsights) {
      if (yPosition > 230) {
        pdf.addPage()
        yPosition = 20
      }

      pdf.setFontSize(12)
      pdf.text('RESUMEN INTELIGENTE:', 20, yPosition)
      yPosition += 15

      // Usar autoTable para el resumen inteligente para mejor control
      const summaryData = [[this.cleanTextForPDF(data.aiInsights.summary)]]

      autoTable(pdf, {
        startY: yPosition,
        body: summaryData,
        styles: { 
          fontSize: 9,
          cellPadding: 4,
          overflow: 'linebreak',
          lineWidth: 0.1,
          halign: 'left',
          valign: 'top'
        },
        columnStyles: {
          0: { cellWidth: 160, valign: 'top' }
        },
        margin: { left: 20, right: 20 },
        tableWidth: 'auto',
        didParseCell: (hookData) => {
          if (hookData.section === 'body') {
            hookData.cell.styles.minCellHeight = 20
          }
        }
      })

      yPosition = (pdf as any).lastAutoTable.finalY + 15

      // HALLAZGOS CLAVE usando autoTable
      if (data.aiInsights.keyFindings.length > 0) {
        if (yPosition > 230) {
          pdf.addPage()
          yPosition = 20
        }

        pdf.setFontSize(12)
        pdf.text('HALLAZGOS CLAVE:', 20, yPosition)
        yPosition += 10

        const findingsData = data.aiInsights.keyFindings.map((finding, index) => [
          `${index + 1}`,
          this.cleanTextForPDF(finding)
        ])

        autoTable(pdf, {
          startY: yPosition,
          body: findingsData,
          styles: { 
            fontSize: 8,
            cellPadding: 4,
            overflow: 'linebreak',
            lineWidth: 0.1,
            halign: 'left',
            valign: 'top'
          },
          columnStyles: {
            0: { cellWidth: 12, halign: 'center', fontStyle: 'bold', valign: 'top' },
            1: { cellWidth: 148, valign: 'top' }
          },
          margin: { left: 20, right: 20 },
          tableWidth: 'auto',
          didParseCell: (hookData) => {
            if (hookData.section === 'body' && hookData.column.index === 1) {
              hookData.cell.styles.minCellHeight = 12
            }
          }
        })

        yPosition = (pdf as any).lastAutoTable.finalY + 15
      }

      // RECOMENDACIONES IA usando autoTable
      if (data.aiInsights.recommendations.length > 0) {
        if (yPosition > 230) {
          pdf.addPage()
          yPosition = 20
        }

        pdf.setFontSize(12)
        pdf.text('RECOMENDACIONES IA:', 20, yPosition)
        yPosition += 10

        const recommendationsData = data.aiInsights.recommendations.map((recommendation, index) => [
          `${index + 1}`,
          this.cleanTextForPDF(recommendation)
        ])

        autoTable(pdf, {
          startY: yPosition,
          body: recommendationsData,
          styles: { 
            fontSize: 8,
            cellPadding: 4,
            overflow: 'linebreak',
            lineWidth: 0.1,
            halign: 'left',
            valign: 'top'
          },
          columnStyles: {
            0: { cellWidth: 12, halign: 'center', fontStyle: 'bold', valign: 'top' },
            1: { cellWidth: 148, valign: 'top' }
          },
          margin: { left: 20, right: 20 },
          tableWidth: 'auto',
          didParseCell: (hookData) => {
            if (hookData.section === 'body' && hookData.column.index === 1) {
              hookData.cell.styles.minCellHeight = 12
            }
          }
        })

        yPosition = (pdf as any).lastAutoTable.finalY + 15
      }
    }

    // Agregar métricas dinámicas si están disponibles
    if (data.dynamicMetrics && data.dynamicMetrics.length > 0) {
      if (yPosition > 230) {
        pdf.addPage()
        yPosition = 20
      }

      pdf.setFontSize(12)
      pdf.text('METRICAS DINAMICAS DESTACADAS:', 20, yPosition)
      yPosition += 10

      const metricsData = data.dynamicMetrics.slice(0, 5).map(metric => [
        this.cleanTextForPDF(metric.title),
        `${metric.value} (${metric.category || 'General'})`
      ])

      autoTable(pdf, {
        startY: yPosition,
        body: metricsData,
        styles: { 
          fontSize: 8,
          cellPadding: 4,
          overflow: 'linebreak',
          lineWidth: 0.1,
          halign: 'left',
          valign: 'top'
        },
        columnStyles: {
          0: { cellWidth: 80, fontStyle: 'bold', valign: 'top' },
          1: { cellWidth: 80, valign: 'top' }
        },
        margin: { left: 20, right: 20 },
        tableWidth: 'auto',
        didParseCell: (hookData) => {
          if (hookData.section === 'body') {
            hookData.cell.styles.minCellHeight = 10
          }
        }
      })
    }
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
      ['Tasa de Conversión', `${metrics.conversionRate.toFixed(1)}%`],
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
      '📊 Métrica': metric.title,
      'Valor': metric.value,
      'Tipo': metric.type,
      'Categoría': metric.category || 'General',
      'Icono': metric.icon || '',
      'Tendencia': metric.trend ? `${metric.trend.direction === 'up' ? '↗️' : metric.trend.direction === 'down' ? '↘️' : '➡️'} ${metric.trend.value}%` : 'Sin tendencia',
      '🤖 Generado por IA': metric.aiGenerated ? '✅ Sí' : '❌ No'
    }))

    return XLSX.utils.json_to_sheet(data)
  }

  private createSummaryWorksheet(data: ExportData): XLSX.WorkSheet {
    const totalConversations = data.conversations.length
    // Corregir el filtro para usar los valores correctos de status
    const completedConversations = data.conversations.filter(c => 
      (c.status as any) === 'completed' || 
      (c.status as any) === 'COMPLETED'
    ).length
    const abandonedConversations = data.conversations.filter(c => 
      (c.status as any) === 'abandoned' ||
      (c.status as any) === 'ABANDONED'
    ).length
    const activeConversations = data.conversations.filter(c => 
      (c.status as any) === 'active' ||
      (c.status as any) === 'ACTIVE'
    ).length
    const pendingConversations = data.conversations.filter(c => 
      (c.status as any) === 'pending' ||
      (c.status as any) === 'PENDING'
    ).length

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
      ['Tasa de Conversión', `${totalConversations > 0 ? ((completedConversations/totalConversations)*100).toFixed(1) : '0.0'}%`],
      ['Tasa de Abandono', `${totalConversations > 0 ? ((abandonedConversations/totalConversations)*100).toFixed(1) : '0.0'}%`],
      ['Cobertura Análisis IA', `${totalConversations > 0 ? ((withAIAnalysis/totalConversations)*100).toFixed(1) : '0.0'}%`],
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

  // private truncateText(text: string, maxLength: number): string {
  //   if (text.length <= maxLength) return text
  //   return text.substring(0, maxLength - 3) + '...'
  // }

  // Nueva función para limpiar texto de emojis y símbolos problemáticos para PDF
  private cleanTextForPDF(text: string): string {
    // Remover emojis y símbolos Unicode problemáticos
    return text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emojis emocionales
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Símbolos y pictogramas
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transporte y mapas
      .replace(/[\u{1F700}-\u{1F77F}]/gu, '') // Símbolos alquímicos
      .replace(/[\u{1F780}-\u{1F7FF}]/gu, '') // Símbolos geométricos extendidos
      .replace(/[\u{1F800}-\u{1F8FF}]/gu, '') // Flechas suplementarias
      .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Símbolos variados
      .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
      .replace(/📈|📊|📉|🔹|🤖|💡|🎯|📝|⚡|🏆|📋|⭐|🔄|💰|📱|⏰|👥|🎨|🔍|💎|🚀|⚙️|🌟|📌|🔧|📏|🎲/g, '') // Emojis específicos encontrados
      .replace(/[^\x00-\x7F]/g, '') // Remover caracteres no ASCII
      .trim()
  }

  // Nueva función para dividir texto largo
  // private wrapText(pdf: jsPDF, text: string, maxWidth: number): string[] {
  //   const words = text.split(' ')
  //   const lines: string[] = []
  //   let currentLine = ''

  //   words.forEach(word => {
  //     const testLine = currentLine + (currentLine ? ' ' : '') + word
  //     const testWidth = pdf.getTextWidth(testLine)
      
  //     if (testWidth > maxWidth && currentLine) {
  //       lines.push(currentLine)
  //       currentLine = word
  //     } else {
  //       currentLine = testLine
  //     }
  //   })

  //   if (currentLine) {
  //     lines.push(currentLine)
  //   }

  //   return lines
  // }
}

export const exportService = new ExportService() 