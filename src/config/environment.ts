export const config = {
  // OpenAI Configuration
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
    modelFallback: 'gpt-3.5-turbo-0125',
    maxTokens: parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS || '1000'),
    temperature: parseFloat(import.meta.env.VITE_OPENAI_TEMPERATURE || '0.3'),
    
    batchAnalysis: {
      enabled: import.meta.env.VITE_ENABLE_BATCH_ANALYSIS !== 'false',
      maxBatchSize: parseInt(import.meta.env.VITE_BATCH_SIZE || '15'),
      delayBetweenBatches: parseInt(import.meta.env.VITE_BATCH_DELAY || '1500')
    },
    
    localAnalysis: {
      enabled: import.meta.env.VITE_ENABLE_LOCAL_ANALYSIS !== 'false',
      cacheResults: import.meta.env.VITE_CACHE_ANALYSIS !== 'false',
      cacheTTL: parseInt(import.meta.env.VITE_CACHE_TTL || '86400000')
    }
  },

  // Application Configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Web Análisis WSP',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: import.meta.env.MODE || 'development'
  },

  // File Processing Configuration
  fileProcessing: {
    maxSizeInMB: parseInt(import.meta.env.VITE_MAX_FILE_SIZE_MB || '25'),
    supportedFormats: ['.xlsx', '.xls', '.csv'],
    batchSize: parseInt(import.meta.env.VITE_BATCH_SIZE || '15')
  },

  // Analysis Configuration
  analysis: {
    enableBatchProcessing: import.meta.env.VITE_ENABLE_BATCH_PROCESSING !== 'false',
    rateLimitDelay: parseInt(import.meta.env.VITE_RATE_LIMIT_DELAY || '1500'),
    fallbackAnalysis: import.meta.env.VITE_ENABLE_FALLBACK_ANALYSIS !== 'false',
    
    costOptimization: {
      useLocalAnalysis: import.meta.env.VITE_USE_LOCAL_ANALYSIS !== 'false',
      skipDuplicates: import.meta.env.VITE_SKIP_DUPLICATE_ANALYSIS !== 'false',
      compressPrompts: import.meta.env.VITE_COMPRESS_PROMPTS !== 'false',
      useSmartBatching: import.meta.env.VITE_SMART_BATCHING !== 'false'
    }
  }
}

// Configuración específica por tipo de análisis optimizada para GPT-4o-mini
export const analysisConfig = {
  sentiment: {
    model: 'gpt-4o-mini',
    maxTokens: 400,
    temperature: 0.1
  },
  intent: {
    model: 'gpt-4o-mini',
    maxTokens: 500,
    temperature: 0.2
  },
  summary: {
    model: 'gpt-4o-mini',
    maxTokens: 800,
    temperature: 0.4
  },
  batch: {
    model: 'gpt-4o-mini',
    maxTokens: 3000,
    temperature: 0.3
  }
}

// Validación de configuración crítica
export const validateConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  // Validar clave de OpenAI
  if (!config.openai.apiKey) {
    errors.push('VITE_OPENAI_API_KEY es requerida para el análisis de IA')
  }

  // Validar modelo de OpenAI - agregar gpt-4o-mini a los válidos
  const validModels = ['gpt-4o-mini', 'gpt-3.5-turbo', 'gpt-3.5-turbo-0125', 'gpt-4', 'gpt-4-turbo-preview']
  if (!validModels.includes(config.openai.model)) {
    errors.push(`Modelo de OpenAI no válido: ${config.openai.model}. Modelos válidos: ${validModels.join(', ')}`)
  }

  // Validar configuraciones numéricas - ajustar para 4o-mini
  if (config.openai.maxTokens < 100 || config.openai.maxTokens > 8000) {
    errors.push('VITE_OPENAI_MAX_TOKENS debe estar entre 100 y 8000')
  }

  if (config.openai.temperature < 0 || config.openai.temperature > 1) {
    errors.push('VITE_OPENAI_TEMPERATURE debe estar entre 0 y 1')
  }

  if (config.fileProcessing.maxSizeInMB < 1 || config.fileProcessing.maxSizeInMB > 100) {
    errors.push('VITE_MAX_FILE_SIZE_MB debe estar entre 1 y 100')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Configuración específica para desarrollo
export const isDevelopment = config.app.environment === 'development'
export const isProduction = config.app.environment === 'production'

// Helper para logging de configuración (sin mostrar claves sensibles)
export const getConfigForLogging = () => ({
  openai: {
    hasApiKey: !!config.openai.apiKey,
    model: config.openai.model,
    modelFallback: config.openai.modelFallback,
    maxTokens: config.openai.maxTokens,
    temperature: config.openai.temperature,
    batchAnalysis: config.openai.batchAnalysis,
    localAnalysis: config.openai.localAnalysis
  },
  app: config.app,
  fileProcessing: config.fileProcessing,
  analysis: config.analysis,
  analysisConfig
}) 