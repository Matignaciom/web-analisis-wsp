import { useState, useEffect } from 'react'
import type { Conversation } from '../domain/entities/Conversation'
import { DynamicMetricsService } from '../infrastructure/services/DynamicMetricsService'
import type { AIGeneratedDashboard } from '../infrastructure/services/DynamicMetricsService'
import { AnalysisServiceFactory } from '../infrastructure/services/AnalysisServiceFactory'

interface UseDynamicDashboardOptions {
  conversations: Conversation[]
  autoUpdate?: boolean
}

interface UseDynamicDashboardReturn {
  dashboard: AIGeneratedDashboard | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export const useDynamicDashboard = ({
  conversations,
  autoUpdate = true
}: UseDynamicDashboardOptions): UseDynamicDashboardReturn => {
  const [dashboard, setDashboard] = useState<AIGeneratedDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateDashboard = async () => {
    if (!conversations) return

    setIsLoading(true)
    setError(null)

    try {
      // Crear servicio con IA si está disponible
      const analysisService = AnalysisServiceFactory.create()
      const metricsService = new DynamicMetricsService(analysisService)
      
      const generatedDashboard = await metricsService.generateDynamicDashboard(conversations)
      setDashboard(generatedDashboard)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error generando dashboard dinámico'
      setError(errorMessage)
      console.error('Error en useDynamicDashboard:', err)
      
      // Fallback: generar dashboard básico sin IA
      try {
        const fallbackService = new DynamicMetricsService()
        const fallbackDashboard = await fallbackService.generateDynamicDashboard(conversations)
        setDashboard(fallbackDashboard)
        setError(null) // Limpiar error si el fallback funciona
      } catch (fallbackErr) {
        console.error('Error en fallback dashboard:', fallbackErr)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (autoUpdate && conversations.length >= 0) {
      generateDashboard()
    }
  }, [conversations, autoUpdate])

  const refresh = async () => {
    await generateDashboard()
  }

  return {
    dashboard,
    isLoading,
    error,
    refresh
  }
} 