import { OpenAIAnalysisService } from './OpenAIAnalysisService'
import { OptimizedAnalysisService } from './OptimizedAnalysisService'
import { config } from '../../config/environment'
import type { IAnalysisService } from '../../domain/interfaces/IAnalysisService'

export class AnalysisServiceFactory {
  private static instance: IAnalysisService | null = null

  static create(): IAnalysisService {
    if (this.instance) {
      return this.instance
    }

    const apiKey = config.openai.apiKey
    
    if (!apiKey) {
      console.warn('⚠️ No se encontró API key de OpenAI, usando análisis local únicamente')
      this.instance = new OptimizedAnalysisService()
      return this.instance
    }

    // Crear servicio OpenAI base
    const openaiService = new OpenAIAnalysisService(apiKey, config.openai.model)

    // Decidir si usar el servicio optimizado o el original
    if (config.analysis.costOptimization.useLocalAnalysis) {
      console.log(`🏠 Usando servicio de análisis optimizado con ${config.openai.model} + análisis local + cache`)
      this.instance = new OptimizedAnalysisService(openaiService)
    } else {
      console.log(`🤖 Usando servicio de análisis ${config.openai.model} estándar`)
      this.instance = openaiService
    }

    return this.instance
  }

  static reset(): void {
    this.instance = null
  }

  static getServiceInfo(): {
    type: 'optimized' | 'standard' | 'local-only'
    features: string[]
    estimatedCostReduction: string
    model: string
  } {
    const hasApiKey = !!config.openai.apiKey
    const useOptimized = config.analysis.costOptimization.useLocalAnalysis
    const currentModel = config.openai.model

    if (!hasApiKey) {
      return {
        type: 'local-only',
        model: 'Análisis Local',
        features: [
          'Análisis basado en reglas locales',
          'Sin costos de API',
          'Funciona offline',
          'Análisis instantáneo'
        ],
        estimatedCostReduction: '100% (Sin costos de IA)'
      }
    }

    if (useOptimized) {
      return {
        type: 'optimized',
        model: currentModel,
        features: [
          `Modelo ${currentModel} (ultra-económico)`,
          'Análisis local para casos simples (70% casos)',
          'Cache de resultados (24h TTL)',
          'Análisis en lotes optimizado',
          'Prompts comprimidos',
          'Detección de duplicados'
        ],
        estimatedCostReduction: currentModel === 'gpt-4o-mini' ? '90-95% reducción de costos' : '75-85% reducción de costos'
      }
    }

    return {
      type: 'standard',
      model: currentModel,
      features: [
        `Análisis completo con ${currentModel}`,
        'Mayor precisión en casos complejos',
        'Análisis detallado de sentimientos',
        'Detección avanzada de intenciones'
      ],
      estimatedCostReduction: currentModel === 'gpt-4o-mini' ? '80% vs GPT-4 estándar' : '0% (Funcionalidad completa)'
    }
  }
}

// Hook para usar en React
export const useAnalysisService = () => {
  return AnalysisServiceFactory.create()
}

// Utilidad para mostrar información de costos actualizada con GPT-4o-mini
export const getEstimatedCost = (conversationCount: number, serviceType?: 'optimized' | 'standard' | 'local-only') => {
  const info = AnalysisServiceFactory.getServiceInfo()
  const currentType = serviceType || info.type
  const currentModel = config.openai.model

  // Estimaciones basadas en precios reales de OpenAI (actualizados 2024)
  const costPer1000Tokens = {
    'gpt-4o-mini': 0.00015,      // $0.00015 por 1000 tokens input - ULTRA BARATO
    'gpt-3.5-turbo': 0.0005,     // $0.0005 por 1000 tokens input
    'gpt-4': 0.03,               // $0.03 por 1000 tokens input
    'gpt-4-turbo-preview': 0.01  // $0.01 por 1000 tokens input
  }

  const baseCost = costPer1000Tokens[currentModel as keyof typeof costPer1000Tokens] || costPer1000Tokens['gpt-3.5-turbo']
  const averageTokensPerAnalysis = currentModel === 'gpt-4o-mini' ? 800 : 600 // 4o-mini permite más tokens
  const standardCost = conversationCount * (averageTokensPerAnalysis / 1000) * baseCost

  switch (currentType) {
    case 'local-only':
      return {
        cost: 0,
        currency: 'USD',
        description: 'Sin costos - Análisis 100% local',
        model: 'Análisis Local'
      }
    
    case 'optimized':
      const optimizedCost = standardCost * 0.15 // 85% reducción con análisis híbrido
      return {
        cost: Math.round(optimizedCost * 10000) / 10000, // Precisión para números muy pequeños
        currency: 'USD',
        description: `~85% más barato que análisis estándar con ${currentModel}`,
        model: currentModel,
        breakdown: {
          localAnalysis: '~70% conversaciones analizadas localmente',
          batchOptimization: '~50% menos tokens por llamada IA',
          caching: '~30% menos re-análisis'
        }
      }
    
    case 'standard':
      return {
        cost: Math.round(standardCost * 10000) / 10000,
        currency: 'USD',
        description: `Costo completo de análisis con ${currentModel}`,
        model: currentModel
      }
  }
}

// Nueva función para comparar costos entre modelos
export const getModelComparison = (conversationCount: number = 1000) => {
  const models = [
    { name: 'gpt-4', cost: 0.03, description: 'GPT-4 Estándar' },
    { name: 'gpt-4-turbo-preview', cost: 0.01, description: 'GPT-4 Turbo' },
    { name: 'gpt-3.5-turbo', cost: 0.0005, description: 'GPT-3.5 Turbo' },
    { name: 'gpt-4o-mini', cost: 0.00015, description: 'GPT-4o Mini' }
  ]

  const averageTokens = 800
  
  return models.map(model => {
    const totalCost = conversationCount * (averageTokens / 1000) * model.cost
    const savingsVsGPT4 = models[0].cost > 0 ? Math.round((1 - model.cost / models[0].cost) * 100) : 0
    
    return {
      ...model,
      totalCost: Math.round(totalCost * 10000) / 10000,
      savingsVsGPT4: `${savingsVsGPT4}%`,
      recommended: model.name === 'gpt-4o-mini'
    }
  })
} 