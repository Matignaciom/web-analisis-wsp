export const config = {
  // OpenAI Configuration
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4-turbo-preview',
    maxTokens: parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS || '1500'),
    temperature: parseFloat(import.meta.env.VITE_OPENAI_TEMPERATURE || '0.3')
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
    batchSize: parseInt(import.meta.env.VITE_BATCH_SIZE || '5')
  },

  // Analysis Configuration
  analysis: {
    enableBatchProcessing: import.meta.env.VITE_ENABLE_BATCH_PROCESSING !== 'false',
    rateLimitDelay: parseInt(import.meta.env.VITE_RATE_LIMIT_DELAY || '1000'),
    fallbackAnalysis: import.meta.env.VITE_ENABLE_FALLBACK_ANALYSIS !== 'false'
  }
}

// Validación de configuración crítica
export const validateConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  // Validar clave de OpenAI
  if (!config.openai.apiKey) {
    errors.push('VITE_OPENAI_API_KEY es requerida para el análisis de IA')
  }

  // Validar modelo de OpenAI
  const validModels = ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo']
  if (!validModels.includes(config.openai.model)) {
    errors.push(`Modelo de OpenAI no válido: ${config.openai.model}. Modelos válidos: ${validModels.join(', ')}`)
  }

  // Validar configuraciones numéricas
  if (config.openai.maxTokens < 100 || config.openai.maxTokens > 4000) {
    errors.push('VITE_OPENAI_MAX_TOKENS debe estar entre 100 y 4000')
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
    maxTokens: config.openai.maxTokens,
    temperature: config.openai.temperature
  },
  app: config.app,
  fileProcessing: config.fileProcessing,
  analysis: config.analysis
}) 