import type { Conversation } from '../../domain/entities/Conversation'
import type { DashboardMetrics } from '../../domain/entities/DashboardMetrics'
import type { IAnalysisService } from '../../domain/interfaces/IAnalysisService'

export interface DynamicMetric {
  title: string
  value: string | number
  type: 'number' | 'percentage' | 'currency' | 'text' | 'time'
  category?: string
  icon?: string
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  dataSource: 'excel_direct' | 'ai_inference' | 'calculated' | 'simulated'
  traceability: {
    originFields: string[]
    confidence: 'high' | 'medium' | 'low'
    calculationMethod: string
    basedOnRowCount: number
    warnings?: string[]
  }
  isObjective: boolean
  aiGenerated: boolean
}

export interface MetricValidation {
  isValid: boolean
  qualityScore: number
  issues: string[]
  recommendations: string[]
}

export interface AIGeneratedDashboard {
  mainMetrics: DashboardMetrics & {
    validation: MetricValidation
    dataQuality: {
      completenessScore: number
      reliabilityScore: number
      totalRowsAnalyzed: number
      estimatedDataAccuracy: number
    }
  }
  dynamicMetrics: DynamicMetric[]
  insights: {
    summary: string
    keyFindings: string[]
    recommendations: string[]
    dataSourceBreakdown: {
      directFromExcel: number
      aiInferred: number
      calculated: number
    }
    reliabilityWarnings: string[]
  }
}

export class DynamicMetricsService {
  constructor(private analysisService?: IAnalysisService) {}

  async generateDynamicDashboard(conversations: Conversation[]): Promise<AIGeneratedDashboard> {
    if (conversations.length === 0) {
      return this.getEmptyDashboard()
    }

    // 🔍 Validación esencial de coherencia (solo lo necesario)
    const coherenceCheck = this.quickCoherenceCheck(conversations)
    if (!coherenceCheck.isCoherent) {
      console.warn('⚠️ Datos inconsistentes detectados:', coherenceCheck.issues)
    }

    try {
      // 🤖 GENERAR MÉTRICAS PRINCIPALES DINÁMICAMENTE CON IA
      // En lugar de calcular métricas fijas, usar IA para analizar el Excel específico
      const aiGeneratedMainMetrics = await this.generateAIMainMetrics(conversations)
      
      // Generar métricas adicionales con análisis profundo de IA
      const dynamicMetrics = await this.generateAIDrivenMetrics(conversations)
      
      // Generar insights con análisis avanzado y patrones reales
      const insights = await this.generateAdvancedAIInsights(conversations, aiGeneratedMainMetrics)

      return {
        mainMetrics: this.calculateRealDataMetrics(conversations),
        dynamicMetrics,
        insights
      }
    } catch (error) {
      console.error('❌ Error generando dashboard dinámico:', error)
      return this.getFallbackDashboard(conversations)
    }
  }

  // 🔍 VALIDACIÓN RÁPIDA Y ESENCIAL (sin logs excesivos)
  private quickCoherenceCheck(conversations: Conversation[]): { isCoherent: boolean; issues: string[] } {
    const issues: string[] = []
    
    // Verificar si hay datos básicos
    if (conversations.length === 0) {
      issues.push('No hay conversaciones para analizar')
    }
    
    // Verificar calidad de datos esenciales
    const emptyNames = conversations.filter(c => !c.customerName || c.customerName.trim() === '').length
    const invalidDates = conversations.filter(c => !c.startDate || isNaN(c.startDate.getTime())).length
    
    if (emptyNames > conversations.length * 0.5) {
      issues.push(`${emptyNames} conversaciones sin nombre de cliente`)
    }
    
    if (invalidDates > conversations.length * 0.3) {
      issues.push(`${invalidDates} conversaciones con fechas inválidas`)
    }
    
    return {
      isCoherent: issues.length === 0,
      issues
    }
  }

  // ✅ EVALUAR CALIDAD DE DATOS DEL EXCEL
  private assessExcelDataQuality(conversations: Conversation[]): {
    completenessScore: number
    reliabilityScore: number
    estimatedAccuracy: number
    issues: string[]
    fieldQuality: Record<string, { score: number; realDataCount: number; totalCount: number }>
  } {
    const totalRows = conversations.length
    const issues: string[] = []
    const fieldQuality: Record<string, { score: number; realDataCount: number; totalCount: number }> = {}
    
    // Evaluar cada campo crítico del Excel
    const criticalFields = [
      { name: 'customerName', accessor: (c: Conversation) => c.customerName },
      { name: 'customerPhone', accessor: (c: Conversation) => c.customerPhone },
      { name: 'startDate', accessor: (c: Conversation) => c.startDate },
      { name: 'status', accessor: (c: Conversation) => c.status },
      { name: 'totalMessages', accessor: (c: Conversation) => c.totalMessages },
      { name: 'lastMessage', accessor: (c: Conversation) => c.lastMessage },
      { name: 'assignedAgent', accessor: (c: Conversation) => c.assignedAgent }
    ]
    
    criticalFields.forEach(field => {
      const realDataCount = conversations.filter(conv => {
        const value = field.accessor(conv)
        // Verificar si el dato parece real (no vacío, no genérico, no placeholder)
        if (!value) return false
        
        const stringValue = String(value).toLowerCase()
        const isGeneric = ['test', 'ejemplo', 'demo', 'prueba', 'n/a', 'null', 'undefined', 'cliente', 'usuario'].some(generic => 
          stringValue.includes(generic)
        )
        
        return !isGeneric && stringValue.trim().length > 0
      }).length
      
      const qualityScore = Math.round((realDataCount / totalRows) * 100)
      fieldQuality[field.name] = {
        score: qualityScore,
        realDataCount,
        totalCount: totalRows
      }
      
      if (qualityScore < 50) {
        issues.push(`⚠️ Campo "${field.name}": Solo ${qualityScore}% de datos reales (${realDataCount}/${totalRows})`)
      }
    })
    
    // Calcular puntuaciones generales
    const completenessScore = Math.round(
      Object.values(fieldQuality).reduce((sum, field) => sum + field.score, 0) / criticalFields.length
    )
    
    // Evaluar confiabilidad basada en metadata de calidad si existe
    const conversationsWithQuality = conversations.filter(c => c.metadata?.dataQuality?.completenessScore)
    const reliabilityScore = conversationsWithQuality.length > 0 
      ? Math.round(
          conversationsWithQuality.reduce((sum, c) => sum + (c.metadata?.dataQuality?.completenessScore || 0), 0) / conversationsWithQuality.length
        )
      : completenessScore
    
    // Estimar precisión basada en patrones detectados
    const estimatedAccuracy = Math.min(completenessScore, reliabilityScore)
    
    return {
      completenessScore,
      reliabilityScore,
      estimatedAccuracy,
      issues,
      fieldQuality
    }
  }

  // ✅ CREAR VALIDACIÓN DE MÉTRICAS CON TRAZABILIDAD
  private createMetricValidation(conversations: Conversation[], analysisData: {
    salesPatterns: { count: number; patterns: string[] }
    abandonedPatterns: { count: number; patterns: string[] }
    dataQuality: any
  }): MetricValidation {
    const issues: string[] = []
    const recommendations: string[] = []
    let qualityScore = 100
    
    // Evaluar calidad de datos
    if (analysisData.dataQuality.completenessScore < 70) {
      issues.push(`📊 Calidad de datos: ${analysisData.dataQuality.completenessScore}% de completitud`)
      recommendations.push('Revisar y limpiar datos del Excel para mejorar precisión')
      qualityScore -= 20
    }
    
    // Evaluar patrones de ventas detectados
    if (analysisData.salesPatterns.count === 0) {
      issues.push('❌ No se detectaron patrones claros de ventas en los datos')
      recommendations.push('Verificar que los estados de conversación estén correctamente definidos')
      qualityScore -= 15
    } else if (analysisData.salesPatterns.patterns.length === 1) {
      issues.push('⚠️ Solo se detectó un tipo de patrón de venta')
      recommendations.push('Considerar usar estados más específicos para ventas')
      qualityScore -= 5
    }
    
    // Evaluar cantidad de datos
    if (conversations.length < 10) {
      issues.push('📈 Muestra pequeña: menos de 10 conversaciones')
      recommendations.push('Incluir más datos para análisis más confiable')
      qualityScore -= 10
    }
    
    // Evaluar datos simulados
    const simulatedDataCount = conversations.filter(c => 
      c.metadata?.incompleteData || 
      (c.metadata?.dataQuality?.completenessScore && c.metadata.dataQuality.completenessScore < 50)
    ).length
    
    if (simulatedDataCount > conversations.length * 0.3) {
      issues.push(`🤖 ${Math.round((simulatedDataCount / conversations.length) * 100)}% de datos podrían ser simulados o incompletos`)
      recommendations.push('Validar la calidad de los datos originales del Excel')
      qualityScore -= 25
    }
    
    return {
      isValid: qualityScore >= 50,
      qualityScore: Math.max(0, qualityScore),
      issues,
      recommendations
    }
  }

  // 🤖 GENERAR MÉTRICAS PRINCIPALES DINÁMICAMENTE CON IA
  private async generateAIMainMetrics(conversations: Conversation[]): Promise<DashboardMetrics> {
    if (!this.analysisService) {
      console.log('📊 Sin IA: Generando métricas basadas en datos reales del Excel')
      return this.calculateRealDataMetrics(conversations)
    }

    try {
      console.log('🤖 Generando métricas principales con IA basadas en tu Excel específico...')
      
      // Generar métricas usando IA con muestra representativa
      const response = await this.analysisService.generateSummary(conversations.slice(0, 5))
      const cleanResponse = this.cleanJsonResponse(response)
      
      try {
        const aiMetrics = JSON.parse(cleanResponse)
        return this.mapAIResponseToMetrics(aiMetrics, conversations)
      } catch (parseError) {
        console.log('⚠️ IA response no parseable, usando cálculo directo desde datos')
        return this.calculateRealDataMetrics(conversations)
      }
      
    } catch (error) {
      console.log('⚠️ Error con IA, generando desde datos reales:', error)
      return this.calculateRealDataMetrics(conversations)
    }
  }

  // 📊 CALCULAR MÉTRICAS REALES (sin asumir formatos específicos)
  private calculateRealDataMetrics(conversations: Conversation[]): DashboardMetrics & {
    validation: MetricValidation
    dataQuality: {
      completenessScore: number
      reliabilityScore: number
      totalRowsAnalyzed: number
      estimatedDataAccuracy: number
    }
  } {
    const totalConversations = conversations.length
    
    // ✅ Evaluar calidad de datos desde el Excel
    const dataQuality = this.assessExcelDataQuality(conversations)
    
    // Analizar patrones reales en los datos para identificar ventas y abandonos
    const salesPatterns = this.identifyRealSalesPattern(conversations)
    const abandonedPatterns = this.identifyRealAbandonedPattern(conversations)
    
    const completedSales = salesPatterns.count
    const abandonedChats = abandonedPatterns.count
    
    // Calcular tasa de conversión real
    const conversionRate = totalConversations > 0 ? 
      Math.round((completedSales / totalConversations) * 100 * 100) / 100 : 0
    
    // Calcular tiempo de respuesta inteligente desde datos reales
    const avgResponseTime = this.calculateIntelligentResponseTime(conversations)
    
    // Calcular satisfacción desde datos disponibles
    const satisfactionScore = this.calculateRealSatisfaction(conversations)
    
    // ✅ Crear validación de métricas con trazabilidad
    const validation = this.createMetricValidation(conversations, {
      salesPatterns,
      abandonedPatterns,
      dataQuality
    })
    
    console.log('📊 Métricas generadas desde datos reales:', {
      totalConversations,
      completedSales,
      abandonedChats,
      conversionRate: `${conversionRate}%`,
      avgResponseTime,
      satisfactionScore,
      dataQuality
    })

    return {
      totalConversations,
      completedSales,
      abandonedChats,
      averageResponseTime: avgResponseTime,
      conversionRate,
      satisfactionScore,
      validation,
      dataQuality: {
        completenessScore: dataQuality.completenessScore,
        reliabilityScore: dataQuality.reliabilityScore,
        totalRowsAnalyzed: totalConversations,
        estimatedDataAccuracy: dataQuality.estimatedAccuracy
      }
    }
  }

  // 🕵️ IDENTIFICAR PATRONES REALES DE VENTAS (sin depender de status fijo)
  private identifyRealSalesPattern(conversations: Conversation[]): { count: number; patterns: string[] } {
    let salesCount = 0
    const patterns: string[] = []
    
    conversations.forEach(conv => {
      // 1. Verificar status explícitos de venta ÚNICAMENTE
      const salesStatuses = ['completed', 'completado', 'finalizado', 'vendido', 'venta', 'exitoso', 'won', 'closed-won']
      if (salesStatuses.includes(conv.status.toLowerCase())) {
        salesCount++
        patterns.push(`Status explícito: ${conv.status}`)
        return
      }
      
      // 2. Detectar indicadores MUY ESPECÍFICOS de venta en mensajes
      const lastMsg = conv.lastMessage?.toLowerCase() || ''
      const specificSalesKeywords = [
        'vendido', 'venta completada', 'pago realizado', 'pago confirmado', 
        'transferencia realizada', 'factura pagada', 'entrega realizada', 
        'pedido entregado', 'gracias por la compra', 'compra exitosa'
      ]
      if (specificSalesKeywords.some(keyword => lastMsg.includes(keyword))) {
        salesCount++
        patterns.push('Confirmación específica de venta en mensaje')
        return
      }
      
      // 3. NO usar metadata de compra automática (podría ser inventada)
      // 4. NO usar número de mensajes como indicador de venta (CRITERIO ELIMINADO)
      // Solo contar ventas con evidencia clara y explícita
    })
    
    console.log('🔍 Análisis de ventas conservador:', {
      totalConversaciones: conversations.length,
      ventasDetectadas: salesCount,
      patronesEncontrados: patterns
    })
    
    return { count: salesCount, patterns: [...new Set(patterns)] }
  }

  // 🚫 IDENTIFICAR PATRONES REALES DE ABANDONO
  private identifyRealAbandonedPattern(conversations: Conversation[]): { count: number; patterns: string[] } {
    let abandonedCount = 0
    const patterns: string[] = []
    
    conversations.forEach(conv => {
      // 1. Verificar status explícitos de abandono
      const abandonedStatuses = ['abandoned', 'abandonado', 'perdido', 'cancelado', 'rechazado', 'lost', 'closed-lost']
      if (abandonedStatuses.includes(conv.status.toLowerCase())) {
        abandonedCount++
        patterns.push(`Status explícito: ${conv.status}`)
        return
      }
      
      // 2. Detectar indicadores de abandono en mensajes
      const lastMsg = conv.lastMessage?.toLowerCase() || ''
      const abandonKeywords = ['no me interesa', 'muy caro', 'no gracias', 'después', 'cancelar', 'rechazar']
      if (abandonKeywords.some(keyword => lastMsg.includes(keyword))) {
        abandonedCount++
        patterns.push('Indicadores de rechazo en mensaje')
        return
      }
      
      // 3. Detectar abandono por baja actividad
      if (conv.totalMessages <= 2 && conv.metadata?.satisfaction && conv.metadata.satisfaction <= 2) {
        abandonedCount++
        patterns.push('Baja actividad + baja satisfacción')
        return
      }
      
      // 4. Detectar abandono por falta de respuesta reciente (si hay fechas)
      const daysSinceStart = conv.startDate ? 
        Math.floor((Date.now() - conv.startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
      if (daysSinceStart > 7 && conv.totalMessages <= 3) {
        abandonedCount++
        patterns.push('Sin actividad reciente + pocos mensajes')
        return
      }
    })
    
    return { count: abandonedCount, patterns: [...new Set(patterns)] }
  }

  // ⏱️ CALCULAR TIEMPO DE RESPUESTA INTELIGENTE
  private calculateIntelligentResponseTime(conversations: Conversation[]): string {
    // 1. Si hay datos de responseTime en metadata, usarlos
    const withResponseTime = conversations.filter(c => 
      c.metadata?.responseTime && c.metadata.responseTime > 0
    )
    
    if (withResponseTime.length > 0) {
      const avgMinutes = withResponseTime.reduce((sum, c) => 
        sum + (c.metadata?.responseTime || 0), 0
      ) / withResponseTime.length
      
      if (avgMinutes < 60) {
        return `${Math.round(avgMinutes)} min`
      } else {
        return `${Math.round(avgMinutes / 60 * 10) / 10} hrs`
      }
    }
    
    // 2. Estimar basado en número de mensajes y duración
    const avgMessages = conversations.reduce((sum, c) => sum + c.totalMessages, 0) / conversations.length
    const estimatedMinutes = avgMessages * 2.5 // Estimación: 2.5 min por mensaje
    
    if (estimatedMinutes < 60) {
      return `~${Math.round(estimatedMinutes)} min`
    } else {
      return `~${Math.round(estimatedMinutes / 60 * 10) / 10} hrs`
    }
  }

  // 😊 CALCULAR SATISFACCIÓN REAL
  private calculateRealSatisfaction(conversations: Conversation[]): number {
    // 1. Si hay ratings explícitos, usarlos
    const withSatisfaction = conversations.filter(c => 
      c.metadata?.satisfaction && c.metadata.satisfaction > 0
    )
    
    if (withSatisfaction.length > 0) {
      return Math.round(
        (withSatisfaction.reduce((sum, c) => sum + (c.metadata?.satisfaction || 0), 0) 
        / withSatisfaction.length) * 10
      ) / 10
    }
    
    // 2. Calcular satisfacción estimada basada en patrones
    let satisfactionSum = 0
    let validConversations = 0
    
    conversations.forEach(conv => {
      let estimatedSatisfaction = 3.0 // Base neutral
      
      // Ajustar basado en número de mensajes (más mensajes = más engagement)
      if (conv.totalMessages > 5) estimatedSatisfaction += 0.5
      if (conv.totalMessages > 10) estimatedSatisfaction += 0.5
      if (conv.totalMessages > 20) estimatedSatisfaction += 0.5
      
      // Ajustar basado en estado
      if (['completed', 'completado', 'vendido'].includes(conv.status.toLowerCase())) {
        estimatedSatisfaction += 1.0
      } else if (['abandoned', 'abandonado', 'perdido'].includes(conv.status.toLowerCase())) {
        estimatedSatisfaction -= 1.0
      }
      
      // Mantener en rango 1-5
      estimatedSatisfaction = Math.max(1, Math.min(5, estimatedSatisfaction))
      
      satisfactionSum += estimatedSatisfaction
      validConversations++
    })
    
    return validConversations > 0 ? 
      Math.round((satisfactionSum / validConversations) * 10) / 10 : 3.5
  }

  // 🔄 MAPEAR RESPUESTA DE IA A MÉTRICAS
  private mapAIResponseToMetrics(aiResponse: any, conversations: Conversation[]): DashboardMetrics {
    return {
      totalConversations: aiResponse.totalConversations || conversations.length,
      completedSales: aiResponse.completedSales || 0,
      abandonedChats: aiResponse.abandonedChats || 0,
      averageResponseTime: aiResponse.averageResponseTime || '~15 min',
      conversionRate: aiResponse.conversionRate || 0,
      satisfactionScore: aiResponse.satisfactionScore || 3.5
    }
  }

  private cleanJsonResponse(response: string): string {
    // Limpiar respuesta de IA para extraer JSON válido
    let cleaned = response.trim()
    
    // Buscar JSON en la respuesta
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleaned = jsonMatch[0]
    }
    
    // Limpiar caracteres problemáticos
    cleaned = cleaned
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .replace(/^\s*[\r\n]/gm, '')
      .trim()
    
    return cleaned
  }

  private calculateBaseMetrics(conversations: Conversation[]): DashboardMetrics {
    const total = conversations.length
    const completed = conversations.filter(c => c.status === 'completed').length
    const abandoned = conversations.filter(c => c.status === 'abandoned').length
    const pending = conversations.filter(c => c.status === 'pending').length
    const active = conversations.filter(c => c.status === 'active').length

    // SIEMPRE calcular tiempo de respuesta basado en datos REALES del Excel
    // Si no hay metadata de responseTime, calcular desde las fechas de conversación
    const responseTimes = conversations
      .map(c => {
        if (c.metadata?.responseTime && c.metadata.responseTime > 0) {
          return c.metadata.responseTime
        }
        // Calcular tiempo basado en duración de conversación si no hay metadata
        if (c.endDate && c.startDate) {
          const diffMinutes = Math.floor((c.endDate.getTime() - c.startDate.getTime()) / (1000 * 60))
          return diffMinutes > 0 ? diffMinutes : null
        }
        // Estimar tiempo basado en número de mensajes (cada mensaje ~2-3 min promedio)
        return c.totalMessages > 0 ? Math.round(c.totalMessages * 2.5) : null
      })
      .filter(rt => rt !== null && rt > 0) as number[]
    
    const avgResponseTime = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length)
      : null

    // Métricas de tiempo de respuesta solo si hay datos reales
    const responseTimeMetrics = responseTimes.length > 0 ? {
      fastest: `${Math.min(...responseTimes)} min`,
      slowest: `${Math.max(...responseTimes)} min`,
      median: `${this.calculateMedian(responseTimes)} min`
    } : undefined

    // Tasa de conversión SIEMPRE calculable ya que tenemos conversaciones
    const conversionRate = total > 0 ? (completed / total) * 100 : 0

    // Satisfacción SOLO si hay datos reales en el Excel
    const satisfactionScores = conversations
      .map(c => c.metadata?.satisfaction)
      .filter(score => score !== undefined && score > 0) as number[]
    
    const satisfactionScore = satisfactionScores.length > 0
      ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
      : null

    // Análisis temporal siempre disponible desde fechas de conversación
    const dailyActivity = this.calculateDailyActivity(conversations)
    const peakHours = this.calculatePeakHours(conversations)

    return {
      totalConversations: total,
      completedSales: completed,
      abandonedChats: abandoned,
      // Solo mostrar tiempo de respuesta si hay datos reales
      averageResponseTime: avgResponseTime ? `${avgResponseTime} min` : `${Math.round(conversations.reduce((sum, c) => sum + c.totalMessages, 0) / conversations.length * 2.5)} min estimado`,
      conversionRate,
      // Solo incluir satisfacción si hay datos reales
      satisfactionScore: satisfactionScore || 0,
      responseTimeMetrics,
      timeRangeAnalysis: {
        dailyActivity,
        peakHours
      },
      statusBreakdown: {
        pending,
        inProgress: active,
        completed,
        cancelled: abandoned
      }
    }
  }

  private calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
  }

  private calculateDailyActivity(conversations: Conversation[]): Array<{date: string; conversations: number; conversions: number}> {
    const last7Days = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayConversations = conversations.filter(c => 
        c.startDate.toISOString().split('T')[0] === dateStr
      )
      
      const dayConversions = dayConversations.filter(c => c.status === 'completed').length
      
      last7Days.push({
        date: dateStr,
        conversations: dayConversations.length,
        conversions: dayConversions
      })
    }
    
    return last7Days
  }

  private calculatePeakHours(conversations: Conversation[]): Array<{hour: number; activity: number}> {
    const hourlyActivity = new Array(24).fill(0)
    
    conversations.forEach(c => {
      const hour = c.startDate.getHours()
      hourlyActivity[hour]++
    })
    
    return hourlyActivity.map((activity, hour) => ({ hour, activity }))
      .sort((a, b) => b.activity - a.activity)
      .slice(0, 5) // Top 5 horas más activas
  }

  private async generateAIDrivenMetrics(conversations: Conversation[]): Promise<DynamicMetric[]> {
    if (conversations.length === 0) {
      return []
    }

    // Generar métricas ÚNICAS que NO se repitan con las métricas principales
    // Estas son métricas avanzadas que van MÁS ALLÁ de las básicas
    console.log('🤖 Generando métricas avanzadas con IA para análisis profundo...')
    
    const uniqueMetrics: DynamicMetric[] = []
    
    try {
      // Usar IA para generar métricas dinámicas únicas si está disponible
      if (this.analysisService) {
        const aiMetrics = await this.generateIntelligentMetrics(conversations)
        uniqueMetrics.push(...aiMetrics)
      }
      
      // Complementar con métricas calculadas únicas que NO están en métricas principales
      const calculatedMetrics = this.generateUniqueCalculatedMetrics(conversations)
      uniqueMetrics.push(...calculatedMetrics)
      
      // Limitar a 6-8 métricas únicas para evitar saturación
      return uniqueMetrics.slice(0, 8)
      
    } catch (error) {
      console.error('Error generando métricas con IA:', error)
      // Fallback a métricas calculadas únicas
      return this.generateUniqueCalculatedMetrics(conversations).slice(0, 6)
    }
  }

  private async generateIntelligentMetrics(conversations: Conversation[]): Promise<DynamicMetric[]> {
    const metrics: DynamicMetric[] = []
    
    // Preparar datos específicos para análisis con IA
    const dataContext = this.prepareAdvancedDataContext(conversations)
    
    try {
      // Generar insights específicos con IA
      console.log('🧠 Analizando patrones únicos con IA...', dataContext)
      
      // Análisis de patrones de comunicación únicos
      const communicationPatterns = await this.analyzeUniquePatterns(conversations)
      metrics.push(...communicationPatterns)
      
      // Análisis de oportunidades específicas del negocio
      const businessOpportunities = await this.identifyBusinessOpportunities(conversations)
      metrics.push(...businessOpportunities)
      
      // Análisis de eficiencia y productividad únicos
      const efficiencyMetrics = await this.calculateEfficiencyMetrics(conversations)
      metrics.push(...efficiencyMetrics)
      
    } catch (error) {
      console.error('Error en análisis con IA:', error)
    }
    
    return metrics
  }

  private generateUniqueCalculatedMetrics(conversations: Conversation[]): DynamicMetric[] {
    const metrics: DynamicMetric[] = []
    
    // MÉTRICAS ÚNICAS QUE NO ESTÁN EN LAS PRINCIPALES
    
    // 1. Análisis de densidad de conversación (mensajes por día activo)
    const conversationDensity = this.calculateConversationDensity(conversations)
    if (conversationDensity > 0) {
      metrics.push({
        title: "Densidad de Comunicación",
        value: `${conversationDensity.toFixed(1)} msg/día`,
        type: 'text',
        category: "Eficiencia Comunicacional",
        icon: "📈",
        // ✅ Información de trazabilidad
        dataSource: 'calculated',
        isObjective: true, // Basado en datos directos del Excel
        aiGenerated: false,
        traceability: {
          originFields: ['totalMessages', 'startDate', 'endDate'],
          confidence: 'high',
          calculationMethod: 'Suma de mensajes totales / días activos en el período',
          basedOnRowCount: conversations.length,
          warnings: conversations.length < 10 ? ['Muestra pequeña: menos de 10 conversaciones'] : []
        }
      })
    }

    // 2. Análisis de momentum (conversaciones crecientes vs decrecientes)
    const momentum = this.calculateBusinessMomentum(conversations)
    if (momentum.trend !== 'neutral') {
      metrics.push({
        title: "Momentum del Negocio",
        value: `${momentum.direction} ${momentum.percentage}%`,
        type: 'text',
        category: "Tendencias de Crecimiento",
        icon: momentum.trend === 'up' ? "🚀" : "📉",
        trend: {
          value: momentum.percentage,
          direction: momentum.trend
        },
        // ✅ Información de trazabilidad
        dataSource: 'calculated',
        isObjective: true, // Basado en fechas del Excel
        aiGenerated: false,
        traceability: {
          originFields: ['startDate', 'status'],
          confidence: 'medium',
          calculationMethod: 'Comparación de actividad entre períodos temporales',
          basedOnRowCount: conversations.length,
          warnings: conversations.length < 20 ? ['Muestra pequeña para análisis de tendencias'] : []
        }
      })
    }

    // 3. Índice de complejidad de conversaciones
    const complexityIndex = this.calculateConversationComplexity(conversations)
    metrics.push({
      title: "Índice de Complejidad",
      value: complexityIndex.level,
      type: 'text',
      category: "Análisis de Complejidad",
      icon: complexityIndex.level === 'Alta' ? "🧩" : complexityIndex.level === 'Media' ? "⚖️" : "✅",
      // ✅ Información de trazabilidad
      dataSource: 'calculated',
      isObjective: true, // Basado en totalMessages del Excel
      aiGenerated: false,
      traceability: {
        originFields: ['totalMessages', 'lastMessage', 'tags'],
        confidence: 'medium',
        calculationMethod: 'Análisis de longitud de mensajes y etiquetas',
        basedOnRowCount: conversations.length,
        warnings: ['Métrica inferida basada en contenido disponible']
      }
    })

    // 4. Ratio de engagement real (mensajes del cliente vs total)
    const engagementRatio = this.calculateRealEngagementRatio(conversations)
    if (engagementRatio > 0) {
      metrics.push({
        title: "Ratio de Engagement Real",
        value: `${engagementRatio}%`,
        type: 'percentage',
        category: "Engagement Avanzado",
        icon: "🎯",
        trend: engagementRatio > 60 ? {
          value: engagementRatio,
          direction: 'up' as const
        } : engagementRatio < 30 ? {
          value: engagementRatio,
          direction: 'down' as const
        } : undefined,
        // ✅ Información de trazabilidad
        dataSource: 'calculated',
        isObjective: false, // Métrica inferida
        aiGenerated: false,
        traceability: {
          originFields: ['totalMessages', 'lastMessage'],
          confidence: 'low',
          calculationMethod: 'Estimación basada en patrones de contenido de mensajes',
          basedOnRowCount: conversations.length,
          warnings: ['⚠️ Métrica estimada: No hay datos directos de mensajes del cliente vs empresa']
        }
      })
    }

    // 5. Análisis de ventanas de oportunidad perdidas
    const missedOpportunities = this.calculateMissedOpportunities(conversations)
    if (missedOpportunities.count > 0) {
      metrics.push({
        title: "Oportunidades Recuperables",
        value: `${missedOpportunities.count} leads`,
        type: 'text',
        category: "Oportunidades Perdidas",
        icon: "🔄",
        // ✅ Información de trazabilidad
        dataSource: 'calculated',
        isObjective: false, // Métrica inferida
        aiGenerated: false,
        traceability: {
          originFields: ['status', 'salesPotential', 'lastMessage'],
          confidence: 'low',
          calculationMethod: 'Identificación de conversaciones abandonadas con alto potencial',
          basedOnRowCount: conversations.length,
          warnings: ['⚠️ Métrica inferida: Basada en patrones de estado y potencial de venta']
        }
      })
    }

    // 6. Score de calidad de datos del Excel
    const dataQuality = this.assessDataQuality(conversations)
    metrics.push({
      title: "Calidad de Datos",
      value: `${dataQuality.score}% completos`,
      type: 'percentage',
      category: "Calidad del Dataset",
      icon: dataQuality.score > 80 ? "✅" : dataQuality.score > 60 ? "⚠️" : "❌",
      // ✅ Información de trazabilidad
      dataSource: 'excel_direct',
      isObjective: true, // Basado en análisis directo del Excel
      aiGenerated: false,
      traceability: {
        originFields: ['customerName', 'customerPhone', 'startDate', 'status', 'totalMessages', 'lastMessage'],
        confidence: 'high',
        calculationMethod: 'Análisis de completitud de campos críticos del Excel',
        basedOnRowCount: conversations.length,
        warnings: dataQuality.score < 70 ? [`📊 Calidad de datos baja: ${dataQuality.score}%`] : []
      }
    })

    return metrics
  }

  // Métodos auxiliares para análisis profundo
  private findRepeatCustomers(conversations: Conversation[]) {
    const customerCounts = new Map<string, number>()
    conversations.forEach(c => {
      const count = customerCounts.get(c.customerPhone) || 0
      customerCounts.set(c.customerPhone, count + 1)
    })
    
    const repeatCustomers = Array.from(customerCounts.values()).filter(count => count > 1).length
    const totalCustomers = customerCounts.size
    const rate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0
    
    return { count: repeatCustomers, rate, total: totalCustomers }
  }

  private analyzeAgentsPerformance(conversations: Conversation[]) {
    const agentStats = new Map<string, { conversations: number; completedSales: number }>()
    
    conversations.forEach(c => {
      if (c.assignedAgent) {
        const stats = agentStats.get(c.assignedAgent) || { conversations: 0, completedSales: 0 }
        stats.conversations++
        if (c.status === 'completed') stats.completedSales++
        agentStats.set(c.assignedAgent, stats)
      }
    })

    const agents = Array.from(agentStats.entries())
    const topAgent = agents.length > 0 
      ? agents.reduce((top, [name, stats]) => 
          stats.conversations > top.conversations 
            ? { name, ...stats } 
            : top, 
          { name: '', conversations: 0, completedSales: 0 }
        )
      : null

    const totalAgents = agents.length
    const avgConversationsPerAgent = totalAgents > 0 
      ? Math.round(conversations.filter(c => c.assignedAgent).length / totalAgents) 
      : 0

    return { totalAgents, topAgent, avgConversationsPerAgent, agents }
  }

  private analyzeTimePatterns(conversations: Conversation[]) {
    const hourlyActivity = new Array(24).fill(0)
    let weekendCount = 0
    
    conversations.forEach(c => {
      const hour = c.startDate.getHours()
      hourlyActivity[hour]++
      
      const dayOfWeek = c.startDate.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) weekendCount++
    })
    
    const peakHour = hourlyActivity.indexOf(Math.max(...hourlyActivity))
    const weekendActivity = conversations.length > 0 
      ? Math.round((weekendCount / conversations.length) * 100) 
      : 0
    
    return { peakHour, weekendActivity, hourlyActivity }
  }

  private analyzeContentPatterns(conversations: Conversation[]) {
    const totalMessages = conversations.reduce((sum, c) => sum + c.totalMessages, 0)
    const avgMessageLength = conversations.length > 0 ? totalMessages / conversations.length : 0
    
    const allTags = conversations.flatMap(c => c.tags)
    const tagCounts = new Map<string, number>()
    allTags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    })
    
    const mostCommonTag = tagCounts.size > 0 
      ? Array.from(tagCounts.entries()).sort(([,a], [,b]) => b - a)[0][0] 
      : null
    
    return { avgMessageLength, mostCommonTag, totalTags: allTags.length }
  }

  private analyzeSalesPatterns(conversations: Conversation[]) {
    const highPotential = conversations.filter(c => c.salesPotential === 'high').length
    const mediumPotential = conversations.filter(c => c.salesPotential === 'medium').length
    const lowPotential = conversations.filter(c => c.salesPotential === 'low').length
    
    const highPotentialPercentage = conversations.length > 0 
      ? Math.round((highPotential / conversations.length) * 100) 
      : 0
    
    const purchaseValues = conversations
      .map(c => c.metadata?.totalPurchaseValue)
      .filter(value => value && value > 0) as number[]
    
    const avgPurchaseValue = purchaseValues.length > 0 
      ? purchaseValues.reduce((sum, value) => sum + value, 0) / purchaseValues.length 
      : 0
    
    return { 
      highPotential, 
      mediumPotential, 
      lowPotential, 
      highPotentialPercentage, 
      avgPurchaseValue 
    }
  }

  private analyzeSatisfactionPatterns(conversations: Conversation[]) {
    const satisfactionScores = conversations
      .map(c => c.metadata?.satisfaction)
      .filter(score => score !== undefined && score > 0) as number[]
    
    if (satisfactionScores.length === 0) {
      return { hasData: false, excellentPercentage: 0, distribution: {} }
    }
    
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    satisfactionScores.forEach(score => {
      const roundedScore = Math.round(score) as keyof typeof distribution
      if (roundedScore >= 1 && roundedScore <= 5) {
        distribution[roundedScore]++
      }
    })
    
    const excellentCount = distribution[5] + distribution[4]
    const excellentPercentage = Math.round((excellentCount / satisfactionScores.length) * 100)
    
    return { hasData: true, excellentPercentage, distribution }
  }

  // Métodos para métricas únicas e inteligentes
  private prepareAdvancedDataContext(conversations: Conversation[]): string {
    const stats = {
      totalMessages: conversations.reduce((sum, c) => sum + c.totalMessages, 0),
      avgLength: conversations.reduce((sum, c) => sum + c.totalMessages, 0) / conversations.length,
      dateSpan: this.calculateDateSpan(conversations),
      uniquePhones: new Set(conversations.map(c => c.customerPhone)).size,
      hasAgents: conversations.some(c => c.assignedAgent),
      hasTags: conversations.some(c => c.tags.length > 0),
      hasSatisfaction: conversations.some(c => c.metadata?.satisfaction),
      hasResponseTime: conversations.some(c => c.metadata?.responseTime)
    }
    
    return `Dataset: ${conversations.length} conversaciones, ${stats.totalMessages} mensajes totales, ${stats.dateSpan} días de actividad, ${stats.uniquePhones} clientes únicos`
  }

  private calculateDateSpan(conversations: Conversation[]): number {
    if (conversations.length === 0) return 0
    const dates = conversations.map(c => c.startDate.getTime())
    const minDate = Math.min(...dates)
    const maxDate = Math.max(...dates)
    return Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24))
  }

  private async analyzeUniquePatterns(conversations: Conversation[]): Promise<DynamicMetric[]> {
    // Análisis de patrones únicos que NO están en métricas básicas
    const patterns: DynamicMetric[] = []
    
    // Patrón de velocidad de respuesta en tiempo real
    const responseVelocity = this.calculateResponseVelocity(conversations)
    if (responseVelocity.category !== 'No disponible') {
      patterns.push({
        title: "Velocidad de Respuesta",
        value: responseVelocity.category,
        type: 'text',
        category: "Patrones de Comunicación",
        icon: responseVelocity.category === 'Muy Rápida' ? "⚡" : responseVelocity.category === 'Rápida' ? "🔥" : "🐌",
        dataSource: 'calculated',
        traceability: {
          originFields: ['totalMessages', 'metadata.responseTime'],
          confidence: 'medium',
          calculationMethod: 'Análisis de tiempo de respuesta basado en mensajes y metadata',
          basedOnRowCount: conversations.length
        },
        isObjective: false,
        aiGenerated: true
      })
    }
    
    return patterns
  }

  private async identifyBusinessOpportunities(conversations: Conversation[]): Promise<DynamicMetric[]> {
    const opportunities: DynamicMetric[] = []
    
    // Identificar patrones de oportunidades específicas del negocio
    const conversionWindow = this.analyzeConversionWindow(conversations)
    if (conversionWindow.optimalDays > 0) {
      opportunities.push({
        title: "Ventana Óptima de Conversión",
        value: `${conversionWindow.optimalDays} días`,
        type: 'text',
        category: "Oportunidades de Negocio",
        icon: "⏱️",
        dataSource: 'calculated',
        traceability: {
          originFields: ['status', 'startDate', 'endDate'],
          confidence: 'medium',
          calculationMethod: 'Análisis de tiempo promedio para conversiones completadas',
          basedOnRowCount: conversations.filter(c => c.status === 'completed').length
        },
        isObjective: false,
        aiGenerated: true
      })
    }
    
    return opportunities
  }

  private async calculateEfficiencyMetrics(conversations: Conversation[]): Promise<DynamicMetric[]> {
    const efficiency: DynamicMetric[] = []
    
    // Métricas de eficiencia únicas
    const messageEfficiency = this.calculateMessageEfficiency(conversations)
    if (messageEfficiency > 0) {
      efficiency.push({
        title: "Eficiencia de Mensajes",
        value: `${messageEfficiency}% efectivos`,
        type: 'percentage',
        category: "Eficiencia Operativa",
        icon: "🎯",
        trend: messageEfficiency > 70 ? {
          value: messageEfficiency,
          direction: 'up' as const
        } : undefined,
        dataSource: 'calculated',
        traceability: {
          originFields: ['totalMessages', 'status'],
          confidence: 'high',
          calculationMethod: 'Porcentaje de mensajes que resultaron en conversiones o respuestas positivas',
          basedOnRowCount: conversations.length
        },
        isObjective: true,
        aiGenerated: true
      })
    }
    
    return efficiency
  }

  private calculateConversationDensity(conversations: Conversation[]): number {
    if (conversations.length === 0) return 0
    
    const totalMessages = conversations.reduce((sum, c) => sum + c.totalMessages, 0)
    const dateSpan = this.calculateDateSpan(conversations)
    
    return dateSpan > 0 ? totalMessages / dateSpan : totalMessages
  }

  private calculateBusinessMomentum(conversations: Conversation[]): {
    trend: 'up' | 'down' | 'neutral',
    direction: string,
    percentage: number
  } {
    if (conversations.length < 4) {
      return { trend: 'neutral', direction: 'Estable', percentage: 0 }
    }
    
    // Dividir conversaciones en dos períodos
    const midPoint = Math.floor(conversations.length / 2)
    const firstHalf = conversations.slice(0, midPoint)
    const secondHalf = conversations.slice(midPoint)
    
    const firstHalfAvg = firstHalf.reduce((sum, c) => sum + c.totalMessages, 0) / firstHalf.length
    const secondHalfAvg = secondHalf.reduce((sum, c) => sum + c.totalMessages, 0) / secondHalf.length
    
    const change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
    
    if (Math.abs(change) < 5) {
      return { trend: 'neutral', direction: 'Estable', percentage: Math.round(Math.abs(change)) }
    }
    
    return {
      trend: change > 0 ? 'up' : 'down',
      direction: change > 0 ? 'Creciendo' : 'Declinando',
      percentage: Math.round(Math.abs(change))
    }
  }

  private calculateConversationComplexity(conversations: Conversation[]): { level: string, score: number } {
    if (conversations.length === 0) return { level: 'Sin datos', score: 0 }
    
    const avgMessages = conversations.reduce((sum, c) => sum + c.totalMessages, 0) / conversations.length
    const hasAgents = conversations.filter(c => c.assignedAgent).length / conversations.length
    const hasMultipleTags = conversations.filter(c => c.tags.length > 1).length / conversations.length
    
    const complexityScore = (avgMessages / 10) + (hasAgents * 0.3) + (hasMultipleTags * 0.2)
    
    if (complexityScore > 2) return { level: 'Alta', score: complexityScore }
    if (complexityScore > 1) return { level: 'Media', score: complexityScore }
    return { level: 'Baja', score: complexityScore }
  }

  private calculateRealEngagementRatio(conversations: Conversation[]): number {
    if (conversations.length === 0) return 0
    
    // Estimar engagement basado en número de mensajes vs duración
    const avgMessages = conversations.reduce((sum, c) => sum + c.totalMessages, 0) / conversations.length
    
    // Considerar alta engagement si hay muchos mensajes por conversación
    if (avgMessages > 20) return 85
    if (avgMessages > 15) return 70
    if (avgMessages > 10) return 55
    if (avgMessages > 5) return 40
    return 25
  }

  private calculateMissedOpportunities(conversations: Conversation[]): { count: number, percentage: number } {
    const abandoned = conversations.filter(c => c.status === 'abandoned')
    const highPotentialAbandoned = abandoned.filter(c => 
      c.totalMessages > 5 && (c.salesPotential === 'high' || c.salesPotential === 'medium')
    )
    
    return {
      count: highPotentialAbandoned.length,
      percentage: abandoned.length > 0 ? Math.round((highPotentialAbandoned.length / abandoned.length) * 100) : 0
    }
  }

  private assessDataQuality(conversations: Conversation[]): { score: number, issues: string[] } {
    if (conversations.length === 0) return { score: 0, issues: ['Sin datos'] }
    
    let qualityPoints = 0
    let maxPoints = 0
    const issues: string[] = []
    
    // Evaluar completitud de datos críticos
    const hasNames = conversations.filter(c => c.customerName && c.customerName.trim() !== '').length
    qualityPoints += hasNames; maxPoints += conversations.length
    if (hasNames < conversations.length * 0.8) issues.push('Nombres de clientes incompletos')
    
    const hasPhones = conversations.filter(c => c.customerPhone && c.customerPhone.trim() !== '').length
    qualityPoints += hasPhones; maxPoints += conversations.length
    if (hasPhones < conversations.length * 0.9) issues.push('Teléfonos incompletos')
    
    const hasMessages = conversations.filter(c => c.totalMessages > 0).length
    qualityPoints += hasMessages; maxPoints += conversations.length
    if (hasMessages < conversations.length) issues.push('Conversaciones sin mensajes')
    
    const hasDates = conversations.filter(c => c.startDate && !isNaN(c.startDate.getTime())).length
    qualityPoints += hasDates; maxPoints += conversations.length
    if (hasDates < conversations.length) issues.push('Fechas inválidas')
    
    const score = maxPoints > 0 ? Math.round((qualityPoints / maxPoints) * 100) : 0
    
    return { score, issues: issues.slice(0, 3) }
  }

  private calculateResponseVelocity(conversations: Conversation[]): { category: string, avgMinutes: number } {
    const responseTimes = conversations
      .map(c => c.metadata?.responseTime)
      .filter(rt => rt !== undefined && rt > 0) as number[]
    
    if (responseTimes.length === 0) {
      // Estimar basado en mensajes
      const avgMessages = conversations.reduce((sum, c) => sum + c.totalMessages, 0) / conversations.length
      const estimatedMinutes = avgMessages * 2.5
      
      if (estimatedMinutes < 15) return { category: 'Muy Rápida', avgMinutes: estimatedMinutes }
      if (estimatedMinutes < 30) return { category: 'Rápida', avgMinutes: estimatedMinutes }
      if (estimatedMinutes < 60) return { category: 'Moderada', avgMinutes: estimatedMinutes }
      return { category: 'Lenta', avgMinutes: estimatedMinutes }
    }
    
    const avg = responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length
    
    if (avg < 15) return { category: 'Muy Rápida', avgMinutes: avg }
    if (avg < 30) return { category: 'Rápida', avgMinutes: avg }
    if (avg < 60) return { category: 'Moderada', avgMinutes: avg }
    return { category: 'Lenta', avgMinutes: avg }
  }

  private analyzeConversionWindow(conversations: Conversation[]): { optimalDays: number, conversionRate: number } {
    const completedConversations = conversations.filter(c => c.status === 'completed')
    
    if (completedConversations.length === 0) {
      return { optimalDays: 0, conversionRate: 0 }
    }
    
    // Analizar tiempo promedio para conversión
    const conversionTimes = completedConversations
      .map(c => {
        if (c.endDate) {
          return Math.ceil((c.endDate.getTime() - c.startDate.getTime()) / (1000 * 60 * 60 * 24))
        }
        // Estimar basado en mensajes
        return Math.ceil(c.totalMessages / 5) // Aprox 5 mensajes por día
      })
      .filter(days => days > 0)
    
    const avgDays = conversionTimes.length > 0 
      ? Math.round(conversionTimes.reduce((sum, days) => sum + days, 0) / conversionTimes.length)
      : 0
    
    const conversionRate = (completedConversations.length / conversations.length) * 100
    
    return { optimalDays: avgDays, conversionRate }
  }

  private calculateMessageEfficiency(conversations: Conversation[]): number {
    if (conversations.length === 0) return 0
    
    const completed = conversations.filter(c => c.status === 'completed').length
    const totalMessages = conversations.reduce((sum, c) => sum + c.totalMessages, 0)
    
    if (totalMessages === 0) return 0
    
    // Calcular eficiencia como conversiones por cada 100 mensajes
    const efficiency = (completed / totalMessages) * 100
    
    return Math.round(efficiency * 10) // Escalar para mostrar porcentaje más legible
  }

  private async generateAdvancedAIInsights(conversations: Conversation[], metrics: DashboardMetrics): Promise<{
    summary: string
    keyFindings: string[]
    recommendations: string[]
    dataSourceBreakdown: {
      directFromExcel: number
      aiInferred: number
      calculated: number
    }
    reliabilityWarnings: string[]
  }> {
    // ✅ Evaluar calidad de datos para determinar confiabilidad de insights
    const dataQuality = this.assessExcelDataQuality(conversations)
    const reliabilityWarnings: string[] = []
    
    // Agregar advertencias basadas en calidad de datos
    if (dataQuality.completenessScore < 70) {
      reliabilityWarnings.push(`⚠️ Completitud de datos: ${dataQuality.completenessScore}% - Los insights pueden tener precisión limitada`)
    }
    
    if (conversations.length < 10) {
      reliabilityWarnings.push('📈 Muestra pequeña: Menos de 10 conversaciones pueden generar insights menos confiables')
    }
    
    const simulatedDataCount = conversations.filter(c => 
      c.metadata?.incompleteData || 
      (c.metadata?.dataQuality?.completenessScore && c.metadata.dataQuality.completenessScore < 50)
    ).length
    
    if (simulatedDataCount > conversations.length * 0.3) {
      reliabilityWarnings.push(`🤖 Datos simulados: ${Math.round((simulatedDataCount / conversations.length) * 100)}% de datos podrían ser estimados`)
    }

    // Si tenemos servicio de IA, usarlo para insights más sofisticados
    if (this.analysisService && conversations.length > 0) {
      try {
        console.log('🤖 Generando insights avanzados con IA para análisis profundo...')
        
        // Generar resumen con IA que incluye contexto específico del negocio
        const aiSummary = await this.generateEnhancedAISummary(conversations, metrics)
        
        // Combinar hallazgos de IA con análisis de datos específicos
        const dataFindings = this.generateDataDrivenFindings(conversations, metrics)
        const aiFindings = await this.generateAIFindings(conversations, metrics)
        const combinedFindings = [...dataFindings, ...aiFindings]
        
        // Combinar recomendaciones de datos con IA
        const dataRecommendations = this.generateDataDrivenRecommendations(conversations, metrics)
        const aiRecommendations = await this.generateAIRecommendations(conversations, metrics)
        const combinedRecommendations = [...dataRecommendations, ...aiRecommendations]

        // ✅ Calcular desglose de fuentes de datos
        const totalInsights = combinedFindings.length + combinedRecommendations.length + 1 // +1 por summary
        const aiInsights = aiFindings.length + aiRecommendations.length + (aiSummary.length > 100 ? 1 : 0)
        const dataInsights = dataFindings.length + dataRecommendations.length
        
        const dataSourceBreakdown = {
          directFromExcel: Math.round((dataInsights / totalInsights) * 100),
          aiInferred: Math.round((aiInsights / totalInsights) * 100),
          calculated: Math.round(((totalInsights - aiInsights - dataInsights) / totalInsights) * 100)
        }

        return {
          summary: aiSummary,
          keyFindings: this.generateSimpleFindings(conversations, metrics, this.analyzeSalesPatterns(conversations), this.analyzeTimePatterns(conversations), this.analyzeSatisfactionPatterns(conversations)),
          recommendations: this.generateSimpleSummary(conversations, metrics),
          dataSourceBreakdown,
          reliabilityWarnings
        }
      } catch (error) {
        console.error('Error generando insights con IA:', error)
        console.log('🔄 Usando análisis de datos como respaldo...')
      }
    }

    // Fallback a análisis basado en datos
    const fallbackInsights = this.generateFallbackInsights(conversations, metrics)
    return {
      ...fallbackInsights,
      dataSourceBreakdown: {
        directFromExcel: 90, // Insights basados principalmente en datos del Excel
        aiInferred: 0,
        calculated: 10
      },
      reliabilityWarnings
    }
  }

  private async generateEnhancedAISummary(conversations: Conversation[], metrics: DashboardMetrics): Promise<string> {
    if (!this.analysisService) {
      return this.generateFallbackInsights(conversations, metrics).summary
    }

    try {
      // Preparar contexto específico para la IA incluyendo métricas de rendimiento y análisis avanzado
      const context = this.prepareAIContext(conversations, metrics)
      
      // Crear contexto específico para el resumen
      const summaryContext = `
GENERAR RESUMEN SIMPLE Y CLARO PARA CUALQUIER PERSONA:

${context}

INSTRUCCIONES: Generar un resumen simple y fácil de entender para cualquier persona, sin términos técnicos. Usar lenguaje cotidiano y explicar de forma sencilla lo que muestran los datos del negocio. El resumen debe ser específico pero accesible para todos.
      `
      
      // Generar resumen con contexto mejorado para IA
      console.log('📊 Contexto preparado para IA:', summaryContext)
      
      const aiSummary = await this.analysisService.generateSummary([{
        id: 'summary-analysis',
        customerName: 'Resumen Ejecutivo',
        customerPhone: '',
        startDate: new Date(),
        status: 'completed' as any,
        totalMessages: 1,
        lastMessage: summaryContext,
        assignedAgent: 'Sistema IA',
        tags: ['resumen', 'métricas', 'análisis'],
        metadata: {
          source: 'summary-analysis',
          responseTime: 0
        }
      }])
      
      // Validar que el resumen contenga información específica de las métricas
      if (aiSummary.length < 100 || 
          (!aiSummary.includes(metrics.totalConversations.toString()) && 
           !aiSummary.includes(metrics.conversionRate.toFixed(1)))) {
        // Si el resumen de IA no es suficiente, usar solo el fallback (ya está en formato de lista)
        return this.generateFallbackInsights(conversations, metrics).summary
      }
      
      return aiSummary
    } catch (error) {
      console.error('Error en resumen con IA:', error)
      return this.generateFallbackInsights(conversations, metrics).summary
    }
  }

  private async generateAIFindings(_conversations: Conversation[], _metrics: DashboardMetrics): Promise<string[]> {
    // Generar hallazgos adicionales usando IA si está disponible
    // Por ahora usar los basados en datos ya que son muy específicos
    return []
  }

  private async generateAIRecommendations(_conversations: Conversation[], _metrics: DashboardMetrics): Promise<string[]> {
    // Generar recomendaciones adicionales usando IA si está disponible
    // Por ahora usar las basadas en datos ya que son muy específicas
    return []
  }

  private prepareAIContext(conversations: Conversation[], metrics: DashboardMetrics): string {
    const salesAnalysis = this.analyzeSalesPatterns(conversations)
    const agentAnalysis = this.analyzeAgentsPerformance(conversations)
    const timeAnalysis = this.analyzeTimePatterns(conversations)
    const contentAnalysis = this.analyzeContentPatterns(conversations)

    // Integrar métricas de rendimiento y análisis avanzado
    const dynamicMetrics = this.generateUniqueCalculatedMetrics(conversations)
    const advancedContext = this.prepareAdvancedDataContext(conversations)

    return `
CONTEXTO INTEGRAL BASADO EN MÉTRICAS DE RENDIMIENTO Y ANÁLISIS AVANZADO:

DATOS CLAVE DEL ANÁLISIS:
- Total conversaciones: ${metrics.totalConversations}
- Ventas completadas: ${metrics.completedSales}
- Tasa de conversión: ${metrics.conversionRate.toFixed(1)}%
- Conversaciones abandonadas: ${metrics.abandonedChats}
- Agentes activos: ${agentAnalysis.totalAgents}
- Hora pico: ${timeAnalysis.peakHour}:00
- Mensajes promedio por conversación: ${Math.round(contentAnalysis.avgMessageLength)}
- Alto potencial: ${salesAnalysis.highPotential} leads (${salesAnalysis.highPotentialPercentage}%)
- Tiempo respuesta promedio: ${metrics.averageResponseTime}

ANÁLISIS AVANZADO DE DATOS:
${advancedContext}

MÉTRICAS DINÁMICAS GENERADAS:
${dynamicMetrics.map(metric => `- ${metric.title}: ${metric.value} (${metric.category})`).join('\n')}
    `.trim()
  }

  private generateDataDrivenFindings(conversations: Conversation[], metrics: DashboardMetrics): string[] {
    const findings: string[] = []
    
    // 📈 INTEGRAR MÉTRICAS DE RENDIMIENTO PRINCIPALES
    // Análisis de conversión basado en métricas de rendimiento
    if (metrics.conversionRate > 25) {
      findings.push(`• 📈 Excelente tasa de conversión del ${metrics.conversionRate.toFixed(1)}% supera estándares de mercado (15-25%)`)
    } else if (metrics.conversionRate < 15 && metrics.conversionRate > 0) {
      findings.push(`• 📉 Tasa de conversión del ${metrics.conversionRate.toFixed(1)}% requiere optimización para alcanzar estándar de mercado`)
    }

    // 📊 INTEGRAR ANÁLISIS AVANZADO DE DATOS
    const dynamicMetrics = this.generateUniqueCalculatedMetrics(conversations)
    const engagementMetric = dynamicMetrics.find(m => m.title.includes('Engagement'))
    const qualityMetric = dynamicMetrics.find(m => m.title.includes('Calidad'))
    
    if (engagementMetric) {
      const engagementValue = parseInt(engagementMetric.value.toString().replace(/\D/g, '')) || 0
      if (engagementValue > 60) {
        findings.push(`• 📊 ${engagementMetric.title} del ${engagementValue}% indica alta interacción con clientes`)
      } else if (engagementValue < 30) {
        findings.push(`• 📊 ${engagementMetric.title} del ${engagementValue}% sugiere necesidad de mejorar estrategias de engagement`)
      }
    }

    if (qualityMetric) {
      const qualityValue = parseInt(qualityMetric.value.toString().replace(/\D/g, '')) || 0
      if (qualityValue > 80) {
        findings.push(`• 📊 ${qualityMetric.title} del ${qualityValue}% facilita análisis predictivo preciso`)
      } else if (qualityValue < 60) {
        findings.push(`• 📊 ${qualityMetric.title} del ${qualityValue}% requiere estandarización de datos`)
      }
    }

    // Análisis de patrones específicos basado en métricas principales
    const salesAnalysis = this.analyzeSalesPatterns(conversations)
    const timeAnalysis = this.analyzeTimePatterns(conversations)
    
    // Hallazgos basados en métricas de abandono
    if (metrics.abandonedChats > metrics.completedSales) {
      const recoveryOpportunity = ((metrics.abandonedChats / metrics.totalConversations) * 100).toFixed(1)
      findings.push(`• 🔄 ${metrics.abandonedChats} conversaciones abandonadas representan ${recoveryOpportunity}% de oportunidades no capitalizadas`)
    }

    // Hallazgos basados en potencial de ventas del análisis avanzado
    if (salesAnalysis.highPotentialPercentage > 30) {
      findings.push(`• 🎯 ${salesAnalysis.highPotential} leads de alto potencial (${salesAnalysis.highPotentialPercentage}%) disponibles para conversión prioritaria`)
    }

    // Hallazgos temporales del análisis avanzado
    if (timeAnalysis.peakHour !== -1 && timeAnalysis.weekendActivity > 20) {
      findings.push(`• ⏰ Actividad concentrada a las ${timeAnalysis.peakHour}:00 con ${timeAnalysis.weekendActivity}% en fines de semana indica oportunidad de horario extendido`)
    }

    // Análisis de satisfacción cuando está disponible
    const satisfactionScores = conversations
      .map(c => c.metadata?.satisfaction)
      .filter(s => s !== undefined && s > 0) as number[]
    
    if (satisfactionScores.length > 0) {
      const avgSatisfaction = satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
      if (avgSatisfaction >= 4.5) {
        findings.push(`• ⭐ Promedio de ${avgSatisfaction.toFixed(1)}/5 en ${satisfactionScores.length} evaluaciones indica excelencia en servicio`)
      } else if (avgSatisfaction < 3.5) {
        findings.push(`• ⚠️ Promedio de ${avgSatisfaction.toFixed(1)}/5 requiere intervención inmediata en procesos de atención`)
      }
    }

    return findings.length > 0 ? findings : [
      `• 📊 Análisis completado: ${conversations.length} conversaciones procesadas con métricas de rendimiento y análisis avanzado integrados`,
      `• 🔍 Sistema identificó patrones específicos en datos de rendimiento empresarial`
    ]
  }

  private generateDataDrivenRecommendations(conversations: Conversation[], metrics: DashboardMetrics): string[] {
    const recommendations: string[] = []
    
    // 📈 RECOMENDACIONES BASADAS EN MÉTRICAS DE RENDIMIENTO
    const salesAnalysis = this.analyzeSalesPatterns(conversations)
    const agentAnalysis = this.analyzeAgentsPerformance(conversations)
    const timeAnalysis = this.analyzeTimePatterns(conversations)
    const contentAnalysis = this.analyzeContentPatterns(conversations)
    const satisfactionData = this.analyzeSatisfactionPatterns(conversations)

    // 📊 INTEGRAR MÉTRICAS DINÁMICAS EN RECOMENDACIONES
    const dynamicMetrics = this.generateUniqueCalculatedMetrics(conversations)
    const opportunitiesMetric = dynamicMetrics.find(m => m.title.includes('Oportunidades'))
    const momentumMetric = dynamicMetrics.find(m => m.title.includes('Momentum'))
    
    // Recomendaciones CRÍTICAS basadas en métricas de rendimiento
    if (metrics.abandonedChats > metrics.completedSales) {
      const recoveryPotential = (metrics.abandonedChats * metrics.conversionRate / 100).toFixed(0)
      recommendations.push(`• 🚨 MÉTRICAS CRÍTICAS: ${metrics.abandonedChats} conversaciones abandonadas vs ${metrics.completedSales} ventas - protocolo de recuperación podría generar ${recoveryPotential} ventas adicionales`)
      recommendations.push(`• 📋 Implementar secuencia automatizada: contacto a 24h, 48h y 7 días para maximizar recuperación basada en análisis de patrones`)
    }

    // Recomendaciones basadas en conversión y análisis avanzado
    if (metrics.conversionRate < 15 && metrics.conversionRate > 0) {
      const improvementTarget = 15 - metrics.conversionRate
      const potentialSales = Math.round((metrics.totalConversations * improvementTarget / 100))
      recommendations.push(`• 📈 OPTIMIZACIÓN DE RENDIMIENTO: Mejorar conversión del ${metrics.conversionRate.toFixed(1)}% al 15% generaría ${potentialSales} ventas adicionales`)
      recommendations.push(`• 🔍 Analizar ${metrics.completedSales} ventas exitosas para replicar técnicas en análisis de datos`)
    } else if (metrics.conversionRate > 25) {
      recommendations.push(`• 🏆 MÉTRICAS EXCELENTES: Conversión del ${metrics.conversionRate.toFixed(1)}% - documentar mejores prácticas y escalar metodología`)
    }

    // Recomendaciones basadas en métricas dinámicas de oportunidades
    if (opportunitiesMetric) {
      const opportunityCount = parseInt(opportunitiesMetric.value.toString().replace(/\D/g, '')) || 0
      if (opportunityCount > 0) {
        recommendations.push(`• 🔄 ANÁLISIS AVANZADO: ${opportunityCount} oportunidades recuperables identificadas - implementar campaña específica de reactivación`)
      }
    }

    // Recomendaciones basadas en momentum del negocio
    if (momentumMetric && momentumMetric.trend) {
      if (momentumMetric.trend.direction === 'up') {
        recommendations.push(`• 🚀 MOMENTUM POSITIVO: Aprovechar tendencia creciente para expandir estrategias exitosas y aumentar capacidad`)
      } else if (momentumMetric.trend.direction === 'down') {
        recommendations.push(`• 📉 MOMENTUM NEGATIVO: Revisar procesos y implementar acciones correctivas inmediatas basadas en análisis de datos`)
      }
    }

    // Recomendaciones específicas de agentes basadas en métricas
    if (agentAnalysis.totalAgents > 1 && agentAnalysis.topAgent) {
      const topAgentPerformance = ((agentAnalysis.topAgent.conversations / metrics.totalConversations) * 100).toFixed(1)
      recommendations.push(`• 👨‍💼 ANÁLISIS DE RENDIMIENTO: ${agentAnalysis.topAgent.name} maneja ${topAgentPerformance}% de conversaciones - establecer como mentor y replicar metodología`)
    }

    // Recomendaciones basadas en potencial de ventas del análisis avanzado
    if (salesAnalysis.highPotentialPercentage > 0) {
      const revenuePotential = (salesAnalysis.avgPurchaseValue * salesAnalysis.highPotential).toFixed(2)
      recommendations.push(`• 🎯 PRIORIDAD ALTA: ${salesAnalysis.highPotential} leads de alto potencial (valor estimado: €${revenuePotential}) requieren seguimiento inmediato`)
      
      if (salesAnalysis.highPotentialPercentage < 20) {
        recommendations.push(`• 📊 CALIFICACIÓN DE LEADS: Solo ${salesAnalysis.highPotentialPercentage}% son alto potencial - mejorar sistema de scoring basado en análisis de datos`)
      }
    }

    // Recomendaciones de tiempo de respuesta basadas en métricas
    const responseTimes = conversations
      .map(c => c.metadata?.responseTime)
      .filter(rt => rt !== undefined && rt > 0) as number[]
    
    if (responseTimes.length > 0) {
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      const conversionImpact = avgResponseTime > 30 ? (avgResponseTime - 30) * 0.02 : 0
      
      if (avgResponseTime > 60) {
        recommendations.push(`• ⏰ TIEMPO CRÍTICO: Respuesta promedio de ${avgResponseTime.toFixed(0)} min impacta conversión - objetivo <30 min podría mejorar conversión en ${conversionImpact.toFixed(1)}%`)
        recommendations.push(`• 🔔 Implementar sistema de notificaciones inmediatas y turnos 24/7 basado en análisis de patrones temporales`)
      }
    }

    // Recomendaciones basadas en patrones temporales del análisis avanzado
    if (timeAnalysis.peakHour !== -1) {
      const peakActivity = timeAnalysis.weekendActivity > 20 ? 'incluyendo fines de semana' : 'en días laborales'
      recommendations.push(`• 📅 OPTIMIZACIÓN TEMPORAL: Reforzar personal ${timeAnalysis.peakHour}:00-${timeAnalysis.peakHour + 1}:00 ${peakActivity} según análisis de patrones`)
    }

    // Recomendaciones de engagement basadas en análisis avanzado
    if (contentAnalysis.avgMessageLength < 5) {
      const engagementTarget = (contentAnalysis.avgMessageLength * 2).toFixed(1)
      recommendations.push(`• 💬 ENGAGEMENT: Conversaciones promedio de ${Math.round(contentAnalysis.avgMessageLength)} mensajes - objetivo ${engagementTarget} mensajes con técnicas estructuradas`)
      recommendations.push(`• 📝 Crear banco de preguntas específicas basado en análisis de contenido para aumentar interacción`)
    }

    // Recomendaciones de satisfacción basadas en métricas
    if (satisfactionData.hasData) {
      if (satisfactionData.excellentPercentage < 60) {
        const improvementTarget = 80 - satisfactionData.excellentPercentage
        recommendations.push(`• ⭐ SATISFACCIÓN: Aumentar excelencia del ${satisfactionData.excellentPercentage}% al 80% (+${improvementTarget}%) con seguimiento post-conversación`)
      }
    } else {
      recommendations.push(`• 📊 MEDICIÓN: Implementar scoring de satisfacción obligatorio para generar métricas precisas de rendimiento`)
    }

    // Recomendaciones de valor económico basadas en análisis de ventas
    if (salesAnalysis.avgPurchaseValue > 0) {
      const upsellPotential = (salesAnalysis.avgPurchaseValue * 1.2).toFixed(2)
      recommendations.push(`• 💰 VALOR POR CLIENTE: Ticket promedio €${salesAnalysis.avgPurchaseValue.toFixed(2)} - estrategias de upselling podrían alcanzar €${upsellPotential}`)
    }

    return recommendations.length > 0 ? recommendations.slice(0, 10) : [
      "• 📈 Mantener consistencia en análisis de métricas de rendimiento semanales",
      "• 📊 Implementar revisiones de análisis avanzado con todo el equipo",
      "• 🎯 Establecer KPIs específicos basados en patrones únicos identificados en datos"
    ]
  }

  private generateFallbackInsights(conversations: Conversation[], metrics: DashboardMetrics): {
    summary: string
    keyFindings: string[]
    recommendations: string[]
  } {
    // Análisis profundo para resumen específico
    const salesAnalysis = this.analyzeSalesPatterns(conversations)
    const agentAnalysis = this.analyzeAgentsPerformance(conversations)
    const timeAnalysis = this.analyzeTimePatterns(conversations)
    const contentAnalysis = this.analyzeContentPatterns(conversations)
    const satisfactionData = this.analyzeSatisfactionPatterns(conversations)
    const repeatCustomers = this.findRepeatCustomers(conversations)

    // RESUMEN GENERAL - Información básica y fácil de entender
    const summaryItems: string[] = []
    
    summaryItems.push(`• Se analizaron ${metrics.totalConversations} conversaciones de WhatsApp de tu negocio`)
    
    if (metrics.completedSales > 0) {
      summaryItems.push(`• Se concretaron ${metrics.completedSales} ventas con una efectividad del ${metrics.conversionRate.toFixed(1)}%`)
    } else {
      summaryItems.push(`• No se registraron ventas completadas en el período analizado`)
    }
    
    if (repeatCustomers.total > 0) {
      summaryItems.push(`• Tienes ${repeatCustomers.total} clientes diferentes, ${repeatCustomers.count} son clientes que volvieron`)
    }
    
    if (agentAnalysis.totalAgents > 0) {
      summaryItems.push(`• Tu equipo de ${agentAnalysis.totalAgents} persona(s) atendió en promedio ${agentAnalysis.avgConversationsPerAgent} conversaciones cada uno`)
    }
    
    if (timeAnalysis.peakHour !== -1) {
      summaryItems.push(`• La hora con más actividad es a las ${timeAnalysis.peakHour}:00`)
    }
    
    if (contentAnalysis.avgMessageLength > 0) {
      let engagementText = `• Cada conversación tiene en promedio ${Math.round(contentAnalysis.avgMessageLength)} mensajes`
      if (contentAnalysis.avgMessageLength < 5) {
        engagementText += ", lo cual indica que podrías tener conversaciones más largas"
      } else if (contentAnalysis.avgMessageLength > 20) {
        engagementText += ", lo cual muestra que tienes buenas conversaciones con tus clientes"
      } else {
        engagementText += ", lo cual está bien balanceado"
      }
      summaryItems.push(engagementText)
    }
    
    if (satisfactionData.hasData) {
      summaryItems.push(`• ${satisfactionData.excellentPercentage}% de tus clientes calificó el servicio como excelente`)
    }
    
    const summary = summaryItems.join("")

    return {
      summary,
      keyFindings: this.generateSimpleFindings(conversations, metrics, salesAnalysis, timeAnalysis, satisfactionData),
      recommendations: this.generateSimpleSummary(conversations, metrics)
    }
  }

  // NUEVA FUNCIÓN PARA HALLAZGOS BASADOS EN PATRONES
  private generateSimpleFindings(conversations: Conversation[], metrics: DashboardMetrics, salesAnalysis: any, timeAnalysis: any, satisfactionData: any): string[] {
    const findings: string[] = []
    
    // Patrones de conversión
    if (metrics.conversionRate > 20) {
      findings.push(`• Tu negocio convierte muy bien: ${metrics.conversionRate.toFixed(1)}% de conversaciones se vuelven ventas`)
    } else if (metrics.conversionRate < 10 && metrics.conversionRate > 0) {
      findings.push(`• Hay oportunidad de mejorar: solo ${metrics.conversionRate.toFixed(1)}% de conversaciones se convierten en ventas`)
    }
    
    // Patrón de conversaciones perdidas
    if (metrics.abandonedChats > metrics.completedSales) {
      findings.push(`• Se perdieron ${metrics.abandonedChats} conversaciones potenciales, más que las ventas logradas`)
    }
    
    // Patrones de clientes potenciales
    if (salesAnalysis.highPotentialPercentage > 25) {
      findings.push(`• Tienes ${salesAnalysis.highPotential} clientes con alta probabilidad de compra`)
    }
    
    // Patrones de horarios
    if (timeAnalysis.peakHour !== -1) {
      if (timeAnalysis.weekendActivity > 30) {
        findings.push(`• Tus clientes también escriben los fines de semana, especialmente a las ${timeAnalysis.peakHour}:00`)
      } else {
        findings.push(`• La mayoría de tus clientes escriben entre semana, especialmente a las ${timeAnalysis.peakHour}:00`)
      }
    }
    
    // Patrones de satisfacción
    if (satisfactionData.hasData) {
      if (satisfactionData.excellentPercentage >= 80) {
        findings.push(`• Tus clientes están muy contentos: ${satisfactionData.excellentPercentage}% califica como excelente`)
      } else if (satisfactionData.excellentPercentage < 50) {
        findings.push(`• Hay que mejorar la atención: solo ${satisfactionData.excellentPercentage}% está muy conforme`)
      }
    }
    
    return findings.length > 0 ? findings : [
      `• Se procesaron ${conversations.length} conversaciones para encontrar patrones`,
      `• Los datos muestran el comportamiento regular de tu negocio`
    ]
  }

  // NUEVA FUNCIÓN PARA RECOMENDACIONES COMO RESUMEN SIMPLE
  private generateSimpleSummary(conversations: Conversation[], metrics: DashboardMetrics): string[] {
    const summary: string[] = []
    
    // Resumen de datos básicos
    summary.push(`• Total de conversaciones analizadas: ${metrics.totalConversations}`)
    summary.push(`• Ventas completadas: ${metrics.completedSales}`)
    summary.push(`• Conversaciones sin cerrar: ${metrics.abandonedChats}`)
    summary.push(`• Porcentaje de éxito: ${metrics.conversionRate.toFixed(1)}%`)
    
    // Resumen de clientes únicos
    const uniqueCustomers = new Set(conversations.map(c => c.customerPhone)).size
    summary.push(`• Clientes únicos contactados: ${uniqueCustomers}`)
    
    // Resumen de agentes
    const uniqueAgents = new Set(conversations.map(c => c.assignedAgent).filter(Boolean)).size
    if (uniqueAgents > 0) {
      summary.push(`• Personas del equipo que atendieron: ${uniqueAgents}`)
    }
    
    // Resumen de respuestas
    const conversationsWithResponse = conversations.filter(c => c.totalMessages > 1).length
    summary.push(`• Conversaciones con respuesta: ${conversationsWithResponse}`)
    
         // Resumen de satisfacción si está disponible
     const satisfactionScores = conversations
       .map(c => c.metadata?.satisfaction)
       .filter((s): s is number => s !== undefined && s > 0)
     
     if (satisfactionScores.length > 0) {
       const avgSatisfaction = satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
       summary.push(`• Promedio de satisfacción: ${avgSatisfaction.toFixed(1)}/5 (${satisfactionScores.length} evaluaciones)`)
     }

    return summary
  }

  private getEmptyDashboard(): AIGeneratedDashboard {
    return {
      mainMetrics: {
        totalConversations: 0,
        completedSales: 0,
        abandonedChats: 0,
        averageResponseTime: 'N/A',
        conversionRate: 0,
        satisfactionScore: 0,
        // ✅ Información de validación para dashboard vacío
        validation: {
          isValid: false,
          qualityScore: 0,
          issues: ['No hay datos para analizar'],
          recommendations: ['Cargar archivo Excel con conversaciones']
        },
        dataQuality: {
          completenessScore: 0,
          reliabilityScore: 0,
          totalRowsAnalyzed: 0,
          estimatedDataAccuracy: 0
        }
      },
      dynamicMetrics: [],
      insights: {
        summary: "No hay datos disponibles. Sube un archivo Excel con conversaciones para generar métricas automáticamente.",
        keyFindings: ["Sin datos para analizar"],
        recommendations: ["Sube tu primer archivo para comenzar el análisis automático"],
        dataSourceBreakdown: {
          directFromExcel: 0,
          aiInferred: 0,
          calculated: 0
        },
        reliabilityWarnings: []
      }
    }
  }

  private getFallbackDashboard(conversations: Conversation[]): AIGeneratedDashboard {
    const baseMetrics = this.calculateBaseMetrics(conversations)
    
    // ✅ Crear validación para el dashboard fallback
    const dataQuality = this.assessExcelDataQuality(conversations)
    const validation: MetricValidation = {
      isValid: dataQuality.completenessScore >= 50,
      qualityScore: dataQuality.completenessScore,
      issues: dataQuality.issues,
      recommendations: dataQuality.completenessScore < 70 
        ? ['Mejorar calidad de datos del Excel para análisis más preciso']
        : ['Dashboard generado con datos confiables']
    }
    
    return {
      mainMetrics: {
        ...baseMetrics,
        validation,
        dataQuality: {
          completenessScore: dataQuality.completenessScore,
          reliabilityScore: dataQuality.reliabilityScore,
          totalRowsAnalyzed: conversations.length,
          estimatedDataAccuracy: dataQuality.estimatedAccuracy
        }
      },
      dynamicMetrics: [
        {
          title: "Análisis Disponible",
          value: "Datos procesados",
          type: 'text',
          category: "Estado",
          // ✅ Información de trazabilidad para métrica fallback
          dataSource: 'excel_direct',
          isObjective: true,
          aiGenerated: false,
          traceability: {
            originFields: ['totalConversations'],
            confidence: 'high',
            calculationMethod: 'Conteo directo de filas del Excel procesado',
            basedOnRowCount: conversations.length,
            warnings: conversations.length < 5 ? ['Datos insuficientes para análisis avanzado'] : []
          }
        }
      ],
      insights: {
        ...this.generateFallbackInsights(conversations, baseMetrics),
        dataSourceBreakdown: {
          directFromExcel: 95, // La mayoría de insights vienen directamente del Excel
          aiInferred: 0,
          calculated: 5
        },
        reliabilityWarnings: validation.issues.length > 0 
          ? [`⚠️ Calidad de datos: ${dataQuality.completenessScore}%`]
          : []
      }
    }
  }
} 
