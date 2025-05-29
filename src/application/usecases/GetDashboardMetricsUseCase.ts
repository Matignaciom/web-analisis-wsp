import type { DashboardMetrics } from '@/domain/entities'
import { ConversationStatus } from '@/domain/entities'
import type { IConversationRepository } from '@/domain/interfaces/IConversationRepository'

export class GetDashboardMetricsUseCase {
  constructor(
    private conversationRepository: IConversationRepository
  ) {}

  async execute(dateRange?: { start: Date; end: Date }): Promise<DashboardMetrics> {
    try {
      // Obtener conversaciones
      const conversations = dateRange 
        ? await this.conversationRepository.getConversationsByDateRange(dateRange.start, dateRange.end)
        : await this.conversationRepository.getAll()

      // Calcular métricas básicas
      const totalConversations = conversations.length
      const completedSales = conversations.filter(c => c.status === ConversationStatus.COMPLETED).length
      const abandonedChats = conversations.filter(c => c.status === ConversationStatus.ABANDONED).length
      
      // Calcular tiempo promedio de respuesta
      const totalResponseTime = conversations.reduce((sum, c) => sum + c.metadata.responseTime, 0)
      const averageResponseTimeMinutes = totalConversations > 0 ? totalResponseTime / totalConversations : 0
      const averageResponseTime = `${averageResponseTimeMinutes.toFixed(1)} min`

      // Calcular tasa de conversión
      const conversionRate = totalConversations > 0 ? (completedSales / totalConversations) * 100 : 0

      // Calcular puntuación de satisfacción promedio
      const satisfactionScores = conversations
        .map(c => c.metadata.satisfaction)
        .filter(score => score !== undefined) as number[]
      const satisfactionScore = satisfactionScores.length > 0 
        ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length 
        : 0

      return {
        totalConversations,
        completedSales,
        abandonedChats,
        averageResponseTime,
        conversionRate,
        satisfactionScore,
        statusBreakdown: {
          pending: conversations.filter(c => c.status === ConversationStatus.PENDING).length,
          inProgress: conversations.filter(c => c.status === ConversationStatus.ACTIVE).length,
          completed: completedSales,
          cancelled: abandonedChats
        }
      }
    } catch (error) {
      console.error('Error obteniendo métricas del dashboard:', error)
      throw new Error('No se pudieron obtener las métricas del dashboard')
    }
  }
} 