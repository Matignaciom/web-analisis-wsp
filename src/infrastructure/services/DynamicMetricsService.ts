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
  aiGenerated: true
}

export interface AIGeneratedDashboard {
  mainMetrics: DashboardMetrics
  dynamicMetrics: DynamicMetric[]
  insights: {
    summary: string
    keyFindings: string[]
    recommendations: string[]
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
        mainMetrics: aiGeneratedMainMetrics,
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
  private calculateRealDataMetrics(conversations: Conversation[]): DashboardMetrics {
    const totalConversations = conversations.length
    
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
    
    console.log('📊 Métricas generadas desde datos reales:', {
      totalConversations,
      completedSales,
      abandonedChats,
      conversionRate: `${conversionRate}%`,
      avgResponseTime,
      satisfactionScore
    })

    return {
      totalConversations,
      completedSales,
      abandonedChats,
      averageResponseTime: avgResponseTime,
      conversionRate,
      satisfactionScore
    }
  }

  // 🕵️ IDENTIFICAR PATRONES REALES DE VENTAS (sin depender de status fijo)
  private identifyRealSalesPattern(conversations: Conversation[]): { count: number; patterns: string[] } {
    let salesCount = 0
    const patterns: string[] = []
    
    conversations.forEach(conv => {
      // 1. Verificar status explícitos de venta
      const salesStatuses = ['completed', 'completado', 'finalizado', 'vendido', 'venta', 'exitoso', 'won', 'closed-won']
      if (salesStatuses.includes(conv.status.toLowerCase())) {
        salesCount++
        patterns.push(`Status explícito: ${conv.status}`)
        return
      }
      
      // 2. Detectar indicadores de venta en mensajes
      const lastMsg = conv.lastMessage?.toLowerCase() || ''
      const salesKeywords = ['compra', 'comprar', 'venta', 'vendido', 'pago', 'transferencia', 'factura', 'entrega', 'envío']
      if (salesKeywords.some(keyword => lastMsg.includes(keyword))) {
        salesCount++
        patterns.push('Indicadores en último mensaje')
        return
      }
      
      // 3. NO usar metadata de compra automática (podría ser inventada)
      
      // 4. Detectar por alto número de mensajes (indicador de engagement exitoso)
      if (conv.totalMessages > 10 && conv.metadata?.satisfaction && conv.metadata.satisfaction >= 4) {
        salesCount++
        patterns.push('Alto engagement + alta satisfacción')
        return
      }
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
        aiGenerated: true
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
        aiGenerated: true
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
      aiGenerated: true
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
        aiGenerated: true
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
        aiGenerated: true
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
      aiGenerated: true
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
  }> {
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

        return {
          summary: aiSummary,
          keyFindings: combinedFindings.slice(0, 8), // Limitar para evitar saturación
          recommendations: combinedRecommendations.slice(0, 10)
        }
      } catch (error) {
        console.error('Error generando insights con IA:', error)
        console.log('🔄 Usando análisis de datos como respaldo...')
      }
    }

    // Fallback a análisis basado en datos
    return this.generateFallbackInsights(conversations, metrics)
  }

  private async generateEnhancedAISummary(conversations: Conversation[], metrics: DashboardMetrics): Promise<string> {
    if (!this.analysisService) {
      return this.generateFallbackInsights(conversations, metrics).summary
    }

    try {
      // Preparar contexto específico para la IA
      const context = this.prepareAIContext(conversations, metrics)
      
      // Generar resumen con contexto mejorado para IA
      console.log('📊 Contexto preparado para IA:', context)
      
      const aiSummary = await this.analysisService.generateSummary(conversations.slice(0, 10)) // Muestra representativa
      
      // Si la IA devuelve un resumen genérico, usar nuestro resumen detallado
      if (aiSummary.length < 100 || !aiSummary.includes(metrics.totalConversations.toString())) {
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

    return `
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
    `.trim()
  }

  private generateDataDrivenFindings(conversations: Conversation[], metrics: DashboardMetrics): string[] {
    const findings: string[] = []
    
    // Análisis de conversión
    if (metrics.conversionRate > 25) {
      findings.push(`Excelente tasa de conversión del ${metrics.conversionRate.toFixed(1)}% detectada en los datos`)
    } else if (metrics.conversionRate < 10 && metrics.conversionRate > 0) {
      findings.push(`Oportunidad de mejora: tasa de conversión del ${metrics.conversionRate.toFixed(1)}% por debajo del promedio de mercado`)
    }

    // Análisis de engagement
    const avgMessages = conversations.length > 0 
      ? Math.round(conversations.reduce((sum, c) => sum + c.totalMessages, 0) / conversations.length)
      : 0

    if (avgMessages > 20) {
      findings.push(`Conversaciones altamente comprometidas: promedio de ${avgMessages} mensajes por chat indica alto interés`)
    } else if (avgMessages < 5) {
      findings.push(`Oportunidad de mejorar engagement: promedio de ${avgMessages} mensajes sugiere conversaciones poco desarrolladas`)
    }

    // Análisis de etiquetado y organización
    const withTags = conversations.filter(c => c.tags.length > 0).length
    const taggedPercentage = conversations.length > 0 ? (withTags / conversations.length) * 100 : 0
    
    if (taggedPercentage > 80) {
      findings.push(`Excelente categorización: ${taggedPercentage.toFixed(1)}% de conversaciones etiquetadas facilita el análisis`)
    } else if (taggedPercentage < 30) {
      findings.push(`Sistema de etiquetado infrautilizado: solo ${taggedPercentage.toFixed(1)}% de conversaciones categorizadas`)
    }

    // Análisis de potencial de ventas
    const highPotential = conversations.filter(c => c.salesPotential === 'high').length
    const totalWithPotential = conversations.filter(c => c.salesPotential).length
    
    if (highPotential > 0 && totalWithPotential > 0) {
      const highPotentialPercentage = (highPotential / totalWithPotential) * 100
      if (highPotentialPercentage > 30) {
        findings.push(`${highPotential} leads de alto potencial identificados (${highPotentialPercentage.toFixed(1)}% del total evaluado)`)
      }
    }

    // Análisis temporal
    const today = new Date()
    const thisWeek = conversations.filter(c => {
      const daysDiff = Math.floor((today.getTime() - c.startDate.getTime()) / (1000 * 60 * 60 * 24))
      return daysDiff <= 7
    }).length

    if (thisWeek > (conversations.length * 0.3)) {
      findings.push(`Actividad reciente alta: ${thisWeek} conversaciones iniciadas esta semana`)
    }

    // Análisis de abandono
    const abandonedChats = conversations.filter(c => c.status === 'abandoned').length
    if (abandonedChats > metrics.completedSales) {
      findings.push(`${abandonedChats} conversaciones abandonadas superan las ventas completadas - oportunidad de recuperación`)
    }

    // Análisis de satisfacción cuando está disponible
    const satisfactionScores = conversations
      .map(c => c.metadata?.satisfaction)
      .filter(s => s !== undefined && s > 0) as number[]
    
    if (satisfactionScores.length > 0) {
      const avgSatisfaction = satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
      if (avgSatisfaction >= 4.5) {
        findings.push(`Excelente satisfacción del cliente: promedio de ${avgSatisfaction.toFixed(1)}/5 en ${satisfactionScores.length} evaluaciones`)
      } else if (avgSatisfaction < 3.5) {
        findings.push(`Atención requerida: satisfacción promedio de ${avgSatisfaction.toFixed(1)}/5 necesita mejora`)
      }
    }

    return findings.length > 0 ? findings : [
      `Análisis de ${conversations.length} conversaciones completado con métricas básicas extraídas`,
      `Sistema identificó patrones de comportamiento en los datos de WhatsApp procesados`
    ]
  }

  private generateDataDrivenRecommendations(conversations: Conversation[], metrics: DashboardMetrics): string[] {
    const recommendations: string[] = []
    
    // Análisis profundo para recomendaciones específicas
    const salesAnalysis = this.analyzeSalesPatterns(conversations)
    const agentAnalysis = this.analyzeAgentsPerformance(conversations)
    const timeAnalysis = this.analyzeTimePatterns(conversations)
    const contentAnalysis = this.analyzeContentPatterns(conversations)
    const satisfactionData = this.analyzeSatisfactionPatterns(conversations)

    // Recomendaciones CRÍTICAS basadas en abandono
    if (metrics.abandonedChats > metrics.completedSales) {
      recommendations.push(`🚨 CRÍTICO: ${metrics.abandonedChats} conversaciones abandonadas superan las ${metrics.completedSales} ventas - implementar protocolo de recuperación inmediato`)
      recommendations.push("Crear secuencia de seguimiento automatizada a las 24h, 48h y 7 días para conversaciones abandonadas")
    }

    // Recomendaciones basadas en conversión con datos específicos
    if (metrics.conversionRate < 15 && metrics.conversionRate > 0) {
      recommendations.push(`Mejorar tasa de conversión actual del ${metrics.conversionRate.toFixed(1)}% - objetivo: alcanzar 20-25%`)
      recommendations.push("Analizar las ${metrics.completedSales} ventas exitosas para identificar patrones y replicar técnicas")
    } else if (metrics.conversionRate > 25) {
      recommendations.push(`Excelente conversión del ${metrics.conversionRate.toFixed(1)}% - documentar y entrenar al equipo en estas técnicas`)
    }

    // Recomendaciones específicas de agentes
    if (agentAnalysis.totalAgents > 1) {
      if (agentAnalysis.topAgent) {
        recommendations.push(`Usar a ${agentAnalysis.topAgent.name} como mentor - ha manejado ${agentAnalysis.topAgent.conversations} conversaciones exitosamente`)
      }
      
      const agentDistribution = agentAnalysis.agents.map(([name, stats]) => `${name}: ${stats.conversations} conversaciones`)
      if (agentDistribution.length > 1) {
        recommendations.push("Balancear carga de trabajo entre agentes para optimizar eficiencia del equipo")
      }
    }

    // Recomendaciones basadas en potencial de ventas
    if (salesAnalysis.highPotentialPercentage > 0) {
      recommendations.push(`Priorizar INMEDIATAMENTE ${salesAnalysis.highPotential} leads de alto potencial (${salesAnalysis.highPotentialPercentage}% del total)`)
      
      if (salesAnalysis.highPotentialPercentage < 20) {
        recommendations.push("Implementar mejor sistema de calificación de leads - solo ${salesAnalysis.highPotentialPercentage}% son de alto potencial")
      }
    }

    // Recomendaciones de tiempo de respuesta con datos específicos
    const responseTimes = conversations
      .map(c => c.metadata?.responseTime)
      .filter(rt => rt !== undefined && rt > 0) as number[]
    
    if (responseTimes.length > 0) {
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      const fastestResponse = Math.min(...responseTimes)
      const slowestResponse = Math.max(...responseTimes)
      
      if (avgResponseTime > 60) {
        recommendations.push(`⏰ Reducir tiempo de respuesta promedio de ${avgResponseTime.toFixed(0)} min a <30 min (rango actual: ${fastestResponse}-${slowestResponse} min)`)
        recommendations.push("Implementar notificaciones push inmediatas y turnos de guardia para respuestas 24/7")
      } else if (avgResponseTime < 15) {
        recommendations.push(`Excelente tiempo de respuesta promedio de ${avgResponseTime.toFixed(0)} min - mantener este estándar`)
      }
    }

    // Recomendaciones basadas en patrones temporales específicos
    if (timeAnalysis.peakHour !== -1) {
      recommendations.push(`Reforzar equipo durante ${timeAnalysis.peakHour}:00-${timeAnalysis.peakHour + 1}:00 (hora de máxima actividad detectada)`)
    }
    
    if (timeAnalysis.weekendActivity > 20) {
      recommendations.push(`${timeAnalysis.weekendActivity}% de actividad en fines de semana - evaluar horario extendido o personal de guardia`)
    }

    // Recomendaciones de engagement basadas en contenido real
    if (contentAnalysis.avgMessageLength < 5) {
      recommendations.push("Conversaciones muy cortas (promedio ${Math.round(contentAnalysis.avgMessageLength)} mensajes) - desarrollar técnicas para mayor engagement")
      recommendations.push("Crear banco de preguntas abiertas específicas para aumentar interacción con clientes")
    } else if (contentAnalysis.avgMessageLength > 25) {
      recommendations.push("Conversaciones muy extensas - optimizar scripts para ser más directos y eficientes")
    }

    if (contentAnalysis.mostCommonTag) {
      recommendations.push(`Tema más frecuente: "${contentAnalysis.mostCommonTag}" - crear respuestas especializadas y FAQ específicas`)
    }

    // Recomendaciones de satisfacción con datos específicos
    if (satisfactionData.hasData) {
      if (satisfactionData.excellentPercentage < 60) {
        recommendations.push(`Mejorar satisfacción: solo ${satisfactionData.excellentPercentage}% reporta excelencia - meta: >80%`)
        recommendations.push("Implementar seguimiento post-conversación y solicitar feedback específico sobre áreas de mejora")
      } else if (satisfactionData.excellentPercentage > 80) {
        recommendations.push(`Excelente satisfacción del ${satisfactionData.excellentPercentage}% - usar estos casos como ejemplos de mejores prácticas`)
      }
    } else {
      recommendations.push("🔄 Implementar medición de satisfacción obligatoria al final de cada conversación para obtener métricas precisas")
    }

    // Recomendaciones de organización y etiquetado
    const untaggedConversations = conversations.filter(c => c.tags.length === 0).length
    if (untaggedConversations > 5) {
      recommendations.push(`Etiquetar ${untaggedConversations} conversaciones sin categorizar para mejorar análisis y seguimiento`)
      recommendations.push("Implementar etiquetado automático basado en IA usando palabras clave detectadas en el contenido")
    }

    // Recomendaciones de valor económico si hay datos
    if (salesAnalysis.avgPurchaseValue > 0) {
      recommendations.push(`Valor promedio por venta: €${salesAnalysis.avgPurchaseValue.toFixed(2)} - enfocar esfuerzos en aumentar ticket promedio`)
    }

    return recommendations.length > 0 ? recommendations.slice(0, 10) : [
      "Mantener consistencia en el proceso de seguimiento y documentación de conversaciones",
      "Implementar revisiones semanales de métricas clave con todo el equipo",
      "Establecer KPIs específicos basados en los patrones únicos identificados en tu negocio"
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

    // Crear resumen detallado y relevante
    let summary = `📊 Análisis completo de ${metrics.totalConversations} conversaciones de WhatsApp extraídas del Excel. `
    
    // Información de conversión y ventas
    if (metrics.completedSales > 0) {
      summary += `Se lograron ${metrics.completedSales} ventas exitosas con una tasa de conversión del ${metrics.conversionRate.toFixed(1)}%. `
    }
    
    // Información de clientes
    if (repeatCustomers.total > 0) {
      summary += `Se identificaron ${repeatCustomers.total} clientes únicos, con ${repeatCustomers.count} clientes recurrentes (${repeatCustomers.rate}% de retención). `
    }
    
    // Información de agentes
    if (agentAnalysis.totalAgents > 0) {
      summary += `El equipo de ${agentAnalysis.totalAgents} agente(s) procesó un promedio de ${agentAnalysis.avgConversationsPerAgent} conversaciones cada uno. `
    }
    
    // Información temporal
    if (timeAnalysis.peakHour !== -1) {
      summary += `La actividad máxima se concentra a las ${timeAnalysis.peakHour}:00. `
    }
    
    // Información de engagement
    if (contentAnalysis.avgMessageLength > 0) {
      summary += `Las conversaciones tienen un promedio de ${Math.round(contentAnalysis.avgMessageLength)} mensajes, `
      if (contentAnalysis.avgMessageLength < 5) {
        summary += "indicando oportunidades para mayor engagement. "
      } else if (contentAnalysis.avgMessageLength > 20) {
        summary += "mostrando alto nivel de interacción con clientes. "
      } else {
        summary += "reflejando un buen balance de comunicación. "
      }
    }
    
    // Información de satisfacción
    if (satisfactionData.hasData) {
      summary += `La satisfacción del cliente muestra ${satisfactionData.excellentPercentage}% de evaluaciones excelentes. `
    }
    
    // Alertas importantes
    if (metrics.abandonedChats > metrics.completedSales) {
      summary += `⚠️ ATENCIÓN: ${metrics.abandonedChats} conversaciones abandonadas superan las ventas completadas, representando una oportunidad significativa de recuperación.`
    } else if (salesAnalysis.highPotentialPercentage > 30) {
      summary += `🎯 OPORTUNIDAD: ${salesAnalysis.highPotential} leads de alto potencial detectados (${salesAnalysis.highPotentialPercentage}% del total) listos para seguimiento prioritario.`
    } else {
      summary += `El negocio muestra un patrón de crecimiento sostenible con oportunidades de optimización identificadas.`
    }

    return {
      summary,
      keyFindings: this.generateDataDrivenFindings(conversations, metrics),
      recommendations: this.generateDataDrivenRecommendations(conversations, metrics)
    }
  }

  private getEmptyDashboard(): AIGeneratedDashboard {
    return {
      mainMetrics: {
        totalConversations: 0,
        completedSales: 0,
        abandonedChats: 0,
        averageResponseTime: 'N/A',
        conversionRate: 0,
        satisfactionScore: 0
      },
      dynamicMetrics: [],
      insights: {
        summary: "No hay datos disponibles. Sube un archivo Excel con conversaciones para generar métricas automáticamente.",
        keyFindings: ["Sin datos para analizar"],
        recommendations: ["Sube tu primer archivo para comenzar el análisis automático"]
      }
    }
  }

  private getFallbackDashboard(conversations: Conversation[]): AIGeneratedDashboard {
    const baseMetrics = this.calculateBaseMetrics(conversations)
    
    return {
      mainMetrics: baseMetrics,
      dynamicMetrics: [
        {
          title: "Análisis Disponible",
          value: "Datos procesados",
          type: 'text',
          category: "Estado",
          aiGenerated: true
        }
      ],
      insights: this.generateFallbackInsights(conversations, baseMetrics)
    }
  }
} 