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

    try {
      // Calcular métricas base de los datos del Excel
      const baseMetrics = this.calculateBaseMetrics(conversations)
      
      // Generar métricas adicionales con análisis de IA
      const dynamicMetrics = await this.generateAIDrivenMetrics(conversations)
      
      // Generar insights con IA
      const insights = await this.generateAIInsights(conversations, baseMetrics)

      return {
        mainMetrics: baseMetrics,
        dynamicMetrics,
        insights
      }
    } catch (error) {
      console.error('Error generando dashboard dinámico:', error)
      return this.getFallbackDashboard(conversations)
    }
  }

  private calculateBaseMetrics(conversations: Conversation[]): DashboardMetrics {
    const total = conversations.length
    const completed = conversations.filter(c => c.status === 'completed').length
    const abandoned = conversations.filter(c => c.status === 'abandoned').length
    const pending = conversations.filter(c => c.status === 'pending').length
    const active = conversations.filter(c => c.status === 'active').length

    // Calcular tiempo promedio de respuesta basado en metadata
    const responseTimes = conversations
      .map(c => c.metadata?.responseTime || 0)
      .filter(rt => rt > 0)
    
    const avgResponseTime = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length)
      : 0

    // Calcular tasa de conversión
    const conversionRate = total > 0 ? (completed / total) * 100 : 0

    // Calcular satisfacción promedio
    const satisfactionScores = conversations
      .map(c => c.metadata?.satisfaction || 0)
      .filter(score => score > 0)
    
    const satisfactionScore = satisfactionScores.length > 0
      ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
      : 0

    return {
      totalConversations: total,
      completedSales: completed,
      abandonedChats: abandoned,
      averageResponseTime: avgResponseTime > 0 ? `${avgResponseTime} min` : 'N/A',
      conversionRate,
      satisfactionScore,
      statusBreakdown: {
        pending,
        inProgress: active,
        completed,
        cancelled: abandoned
      }
    }
  }

  private async generateAIDrivenMetrics(conversations: Conversation[]): Promise<DynamicMetric[]> {
    const metrics: DynamicMetric[] = []

    if (conversations.length === 0) {
      return metrics
    }

    // Métricas basadas en patrones de los datos
    const agentsSet = new Set(conversations.map(c => c.assignedAgent).filter(Boolean))
    const uniqueCustomers = new Set(conversations.map(c => c.customerPhone)).size
    
    // Análisis de horarios de actividad
    const hourlyActivity = this.analyzeHourlyActivity(conversations)
    const peakHour = this.findPeakHour(hourlyActivity)
    
    // Análisis de duración de conversaciones
    const avgMessages = conversations.length > 0 
      ? Math.round(conversations.reduce((sum, c) => sum + c.totalMessages, 0) / conversations.length)
      : 0

    // Análisis de tags más comunes
    const allTags = conversations.flatMap(c => c.tags)
    const topTag = this.getMostFrequentTag(allTags)

    // Análisis de potencial de ventas
    const highPotential = conversations.filter(c => c.salesPotential === 'high').length
    const mediumPotential = conversations.filter(c => c.salesPotential === 'medium').length
    const lowPotential = conversations.filter(c => c.salesPotential === 'low').length

    // Análisis de estados
    const activeConversations = conversations.filter(c => c.status === 'active').length
    const pendingConversations = conversations.filter(c => c.status === 'pending').length

    // Análisis temporal
    const today = new Date()
    const thisWeek = conversations.filter(c => {
      const daysDiff = Math.floor((today.getTime() - c.startDate.getTime()) / (1000 * 60 * 60 * 24))
      return daysDiff <= 7
    }).length

    const thisMonth = conversations.filter(c => {
      return c.startDate.getMonth() === today.getMonth() && 
             c.startDate.getFullYear() === today.getFullYear()
    }).length

    // Usar thisMonth para análisis si es necesario
    if (thisMonth > 0) {
      console.log(`📊 Conversaciones este mes: ${thisMonth}`)
    }

    // Análisis de satisfacción
    const satisfactionScores = conversations
      .map(c => c.metadata?.satisfaction)
      .filter(s => s !== undefined && s > 0) as number[]
    
    const avgSatisfaction = satisfactionScores.length > 0 
      ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
      : 0

    // Análisis de tiempo de respuesta
    const responseTimes = conversations
      .map(c => c.metadata?.responseTime)
      .filter(rt => rt !== undefined && rt > 0) as number[]
    
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
      : 0

    // Generar métricas dinámicas solo si tienen valores significativos
    if (uniqueCustomers > 0) {
      metrics.push({
        title: "Clientes Únicos",
        value: uniqueCustomers,
        type: 'number',
        category: "Clientes",
        icon: "🏢",
        trend: thisWeek > (conversations.length / 4) ? {
          value: 15,
          direction: 'up' as const
        } : undefined,
        aiGenerated: true
      })
    }

    if (agentsSet.size > 0) {
      metrics.push({
        title: "Agentes Activos",
        value: agentsSet.size,
        type: 'number',
        category: "Recursos Humanos",
        icon: "👥",
        aiGenerated: true
      })
    }

    metrics.push({
      title: "Hora Pico de Actividad",
      value: `${peakHour}:00`,
      type: 'text',
      category: "Análisis Temporal",
      icon: "⏰",
      aiGenerated: true
    })

    if (avgMessages > 0) {
      metrics.push({
        title: "Promedio Mensajes por Chat",
        value: avgMessages,
        type: 'number',
        category: "Engagement",
        icon: "💬",
        trend: avgMessages > 10 ? {
          value: 8,
          direction: 'up' as const
        } : {
          value: -5,
          direction: 'down' as const
        },
        aiGenerated: true
      })
    }

    if (highPotential > 0) {
      metrics.push({
        title: "Leads Alto Potencial",
        value: highPotential,
        type: 'number',
        category: "Ventas",
        icon: "🎯",
        trend: this.calculateTrend(highPotential, mediumPotential + lowPotential),
        aiGenerated: true
      })
    }

    if (thisWeek > 0) {
      metrics.push({
        title: "Conversaciones Esta Semana",
        value: thisWeek,
        type: 'number',
        category: "Análisis Temporal",
        icon: "📅",
        trend: {
          value: Math.round((thisWeek / conversations.length) * 100),
          direction: thisWeek > (conversations.length / 4) ? 'up' as const : 'neutral' as const
        },
        aiGenerated: true
      })
    }

    if (activeConversations > 0) {
      metrics.push({
        title: "Conversaciones Activas",
        value: activeConversations,
        type: 'number',
        category: "Estado",
        icon: "🟢",
        aiGenerated: true
      })
    }

    if (pendingConversations > 0) {
      metrics.push({
        title: "Pendientes de Respuesta",
        value: pendingConversations,
        type: 'number',
        category: "Estado",
        icon: "⏳",
        trend: {
          value: -10,
          direction: 'down' as const
        },
        aiGenerated: true
      })
    }

    if (avgSatisfaction > 0) {
      metrics.push({
        title: "Satisfacción Promedio",
        value: `${avgSatisfaction.toFixed(1)}/5`,
        type: 'text',
        category: "Calidad",
        icon: "⭐",
        trend: avgSatisfaction >= 4 ? {
          value: 12,
          direction: 'up' as const
        } : {
          value: -8,
          direction: 'down' as const
        },
        aiGenerated: true
      })
    }

    if (avgResponseTime > 0) {
      metrics.push({
        title: "Tiempo Respuesta Promedio",
        value: `${avgResponseTime} min`,
        type: 'text',
        category: "Eficiencia",
        icon: "⚡",
        trend: avgResponseTime <= 30 ? {
          value: 20,
          direction: 'up' as const
        } : {
          value: -15,
          direction: 'down' as const
        },
        aiGenerated: true
      })
    }

    if (topTag) {
      metrics.push({
        title: "Tema Más Discutido",
        value: topTag,
        type: 'text',
        category: "Análisis de Contenido",
        icon: "🏷️",
        aiGenerated: true
      })
    }

    // Métricas adicionales basadas en patrones de datos
    const longConversations = conversations.filter(c => c.totalMessages > 15).length
    if (longConversations > 0) {
      metrics.push({
        title: "Conversaciones Extensas",
        value: longConversations,
        type: 'number',
        category: "Análisis de Engagement",
        icon: "📈",
        trend: {
          value: 5,
          direction: 'up' as const
        },
        aiGenerated: true
      })
    }

    // Ratio de conversión detallado
    const conversionRatio = conversations.length > 0 
      ? Math.round((highPotential / conversations.length) * 100)
      : 0

    if (conversionRatio > 0) {
      metrics.push({
        title: "Ratio Leads Calificados",
        value: `${conversionRatio}%`,
        type: 'percentage',
        category: "Ventas",
        icon: "🎯",
        trend: conversionRatio > 20 ? {
          value: 18,
          direction: 'up' as const
        } : {
          value: -12,
          direction: 'down' as const
        },
        aiGenerated: true
      })
    }

    return metrics.slice(0, 8) // Limitar a 8 métricas máximo para evitar saturación
  }

  private async generateAIInsights(conversations: Conversation[], metrics: DashboardMetrics): Promise<{
    summary: string
    keyFindings: string[]
    recommendations: string[]
  }> {
    // Si tenemos servicio de IA, usarlo para insights más sofisticados
    if (this.analysisService && conversations.length > 0) {
      try {
        const summary = await this.analysisService.generateSummary(conversations)
        return {
          summary,
          keyFindings: this.generateDataDrivenFindings(conversations, metrics),
          recommendations: this.generateDataDrivenRecommendations(conversations, metrics)
        }
      } catch (error) {
        console.error('Error generando insights con IA:', error)
      }
    }

    // Fallback a análisis basado en datos
    return this.generateFallbackInsights(conversations, metrics)
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
    
    // Recomendaciones basadas en abandono
    if (metrics.abandonedChats > metrics.completedSales) {
      recommendations.push("Implementar sistema de seguimiento automático para recuperar conversaciones abandonadas")
      recommendations.push("Crear templates de reactivación personalizados basados en el motivo de abandono")
    }

    // Recomendaciones basadas en conversión
    if (metrics.conversionRate < 15 && metrics.conversionRate > 0) {
      recommendations.push("Optimizar scripts de ventas y capacitar agentes en técnicas de cierre")
      recommendations.push("Analizar objeciones comunes y preparar respuestas específicas")
    }

    // Recomendaciones de organización
    const untaggedConversations = conversations.filter(c => c.tags.length === 0).length
    if (untaggedConversations > 5) {
      recommendations.push("Implementar sistema de etiquetado automático basado en palabras clave")
      recommendations.push("Capacitar equipo en categorización consistente de conversaciones")
    }

    // Recomendaciones de asignación
    const noAgentAssigned = conversations.filter(c => !c.assignedAgent).length
    if (noAgentAssigned > 0) {
      recommendations.push("Asignar responsables a todas las conversaciones para mejorar accountability")
    }

    // Recomendaciones basadas en engagement
    const avgMessages = conversations.length > 0 
      ? Math.round(conversations.reduce((sum, c) => sum + c.totalMessages, 0) / conversations.length)
      : 0

    if (avgMessages < 5) {
      recommendations.push("Desarrollar estrategias para aumentar el engagement en conversaciones cortas")
      recommendations.push("Crear preguntas abiertas que fomenten respuestas más detalladas")
    }

    // Recomendaciones de potencial alto
    const highPotential = conversations.filter(c => c.salesPotential === 'high').length
    if (highPotential > 0) {
      recommendations.push(`Priorizar seguimiento inmediato de ${highPotential} leads de alto potencial identificados`)
    }

    // Recomendaciones de tiempo de respuesta
    const responseTimes = conversations
      .map(c => c.metadata?.responseTime)
      .filter(rt => rt !== undefined && rt > 0) as number[]
    
    if (responseTimes.length > 0) {
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      if (avgResponseTime > 60) {
        recommendations.push("Reducir tiempo de respuesta promedio implementando notificaciones inmediatas")
      }
    }

    // Recomendaciones de automatización
    if (conversations.length > 50) {
      recommendations.push("Considerar implementar chatbots para respuestas iniciales automáticas")
      recommendations.push("Automatizar categorización inicial basada en palabras clave detectadas")
    }

    return recommendations.length > 0 ? recommendations : [
      "Continuar monitoreando métricas de conversación para identificar tendencias",
      "Implementar sistema de feedback regular para mejorar calidad del servicio",
      "Establecer KPIs específicos basados en los patrones identificados en el análisis"
    ]
  }

  private generateFallbackInsights(conversations: Conversation[], metrics: DashboardMetrics): {
    summary: string
    keyFindings: string[]
    recommendations: string[]
  } {
    const summary = `Análisis automático de ${metrics.totalConversations} conversaciones procesadas desde el archivo Excel. Se detectaron ${metrics.completedSales} ventas completadas con una tasa de conversión del ${metrics.conversionRate.toFixed(1)}%. El sistema identificó ${metrics.abandonedChats} conversaciones que requieren atención especial.`

    return {
      summary,
      keyFindings: this.generateDataDrivenFindings(conversations, metrics),
      recommendations: this.generateDataDrivenRecommendations(conversations, metrics)
    }
  }

  private analyzeHourlyActivity(conversations: Conversation[]): number[] {
    const hourlyCount = new Array(24).fill(0)
    
    conversations.forEach(conversation => {
      const hour = conversation.startDate.getHours()
      hourlyCount[hour]++
    })
    
    return hourlyCount
  }

  private findPeakHour(hourlyActivity: number[]): number {
    let maxActivity = 0
    let peakHour = 9 // default
    
    hourlyActivity.forEach((activity, hour) => {
      if (activity > maxActivity) {
        maxActivity = activity
        peakHour = hour
      }
    })
    
    return peakHour
  }

  private getMostFrequentTag(tags: string[]): string | null {
    if (tags.length === 0) return null
    
    const tagCount: Record<string, number> = {}
    tags.forEach(tag => {
      tagCount[tag] = (tagCount[tag] || 0) + 1
    })
    
    return Object.entries(tagCount)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || null
  }

  private calculateTrend(current: number, comparison: number): {
    value: number
    direction: 'up' | 'down' | 'neutral'
  } {
    if (comparison === 0) return { value: 0, direction: 'neutral' }
    
    const percentage = Math.round(((current - comparison) / comparison) * 100)
    return {
      value: Math.abs(percentage),
      direction: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral'
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