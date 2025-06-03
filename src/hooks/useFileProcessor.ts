import { useState, useCallback } from 'react'
import { useAppStore } from '@/presentation/store/useAppStore'
import { ProcessFileUseCase } from '@/application/usecases/ProcessFileUseCase'
import { GetDashboardMetricsUseCase } from '@/application/usecases/GetDashboardMetricsUseCase'
import { 
  ExcelFileProcessor, 
  OpenAIAnalysisService, 
  InMemoryConversationRepository 
} from '@/infrastructure/services'
import { config, validateConfig, getConfigForLogging } from '@/config/environment'
import toast from 'react-hot-toast'

interface FileProcessorHookResult {
  processFile: (file: File) => Promise<void>
  isProcessing: boolean
  progress: number
  error: string | null
  resetState: () => void
}

export const useFileProcessor = (): FileProcessorHookResult => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const { 
    setDashboardMetrics,
    setLoadingMetrics,
    setConversations 
  } = useAppStore()

  // Inicialización de servicios
  const initializeServices = useCallback(() => {
    console.log('🔧 Inicializando servicios...')
    console.log('📋 Configuración:', getConfigForLogging())
    
    const configValidation = validateConfig()
    if (!configValidation.isValid) {
      console.error('❌ Configuración inválida:', configValidation.errors)
      throw new Error(`Configuración inválida: ${configValidation.errors.join(', ')}`)
    }
    
    console.log('✅ Configuración válida')

    const fileProcessor = new ExcelFileProcessor()
    const conversationRepository = new InMemoryConversationRepository()
    const analysisService = new OpenAIAnalysisService(
      config.openai.apiKey,
      config.openai.model
    )

    const processFileUseCase = new ProcessFileUseCase(
      fileProcessor,
      conversationRepository,
      analysisService
    )

    const getDashboardMetricsUseCase = new GetDashboardMetricsUseCase(
      conversationRepository
    )

    console.log('🎯 Servicios inicializados correctamente')

    return {
      processFileUseCase,
      getDashboardMetricsUseCase,
      conversationRepository
    }
  }, [])

  const processFile = useCallback(async (file: File) => {
    // Validar que el objeto File sea válido
    if (!file || !(file instanceof File)) {
      console.error('❌ Objeto File inválido:', file)
      toast.error('Error: Archivo inválido')
      return
    }

    console.log('📂 Iniciando procesamiento de archivo:', file.name || 'Sin nombre')
    
    // Crear objeto de detalles de archivo de forma segura
    const fileDetails: any = {
      name: file.name || 'archivo_sin_nombre',
      size: file.size || 0,
      type: file.type || 'application/octet-stream'
    }

    // Manejar lastModified de forma segura
    try {
      if (file.lastModified && typeof file.lastModified === 'number') {
        fileDetails.lastModified = new Date(file.lastModified).toISOString()
      } else {
        fileDetails.lastModified = 'No disponible'
      }
    } catch (error) {
      fileDetails.lastModified = 'Fecha inválida'
    }

    console.log('📊 Detalles del archivo:', fileDetails)

    setIsProcessing(true)
    setProgress(0)
    setError(null)

    let toastId: string | undefined

    try {
      // Validar configuración antes de procesar
      console.log('🔍 Validando configuración...')
      const configValidation = validateConfig()
      if (!configValidation.isValid) {
        console.error('❌ Error de configuración:', configValidation.errors)
        throw new Error(`Error de configuración: ${configValidation.errors.join(', ')}`)
      }

      console.log('🔧 Inicializando servicios...')
      const { 
        processFileUseCase, 
        getDashboardMetricsUseCase,
        conversationRepository 
      } = initializeServices()

      // Mostrar toast de progreso
      toastId = toast.loading(`Procesando ${fileDetails.name}...`, {
        duration: Infinity
      })

      // Actualizar progreso: Validación de archivo
      console.log('📋 Validando archivo...')
      setProgress(10)
      
      // Procesar archivo
      console.log('⚙️ Procesando archivo...')
      setProgress(30)
      const result = await processFileUseCase.execute(file)

      console.log('📊 Resultado del procesamiento:', {
        success: result.success,
        totalProcessed: result.totalProcessed,
        conversationsCreated: result.conversationsCreated,
        errorsCount: result.errors.length
      })

      if (!result.success) {
        throw new Error(result.error || 'Error desconocido en el procesamiento')
      }

      // Actualizar progreso: Análisis completado
      setProgress(70)

      // Obtener conversaciones y métricas actualizadas
      console.log('📈 Obteniendo conversaciones actualizadas...')
      const conversations = await conversationRepository.getAll()
      setConversations(conversations)

      // Actualizar métricas del dashboard
      setProgress(85)
      setLoadingMetrics(true)
      console.log('📊 Calculando métricas del dashboard...')
      const metrics = await getDashboardMetricsUseCase.execute()
      setDashboardMetrics(metrics)
      setLoadingMetrics(false)

      // Completar progreso
      setProgress(100)

      // Mostrar resumen de resultados
      const successMessage = `
        ✅ Archivo procesado exitosamente
        📊 ${result.conversationsCreated} conversaciones creadas
        ⚡ ${result.totalProcessed} registros procesados
        ⏱️ ${Math.round(result.summary.processingTime / 1000)}s
      `

      console.log('🎉 Procesamiento completado exitosamente')

      toast.success(successMessage, {
        duration: 5000,
        style: {
          whiteSpace: 'pre-line'
        }
      })

      // Mostrar advertencias si las hay
      const warnings = result.errors.filter(e => e.severity === 'warning')
      if (warnings.length > 0) {
        console.warn('⚠️ Advertencias encontradas:', warnings)
        toast(`⚠️ ${warnings.length} advertencias detectadas`, {
          duration: 3000,
          icon: '⚠️'
        })
      }

      // Mostrar errores si los hay
      const errors = result.errors.filter(e => e.severity === 'error')
      if (errors.length > 0) {
        console.error('❌ Errores encontrados:', errors)
        toast(`❌ ${errors.length} errores en el procesamiento`, {
          duration: 4000,
          icon: '❌'
        })
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      console.error('💥 Error durante el procesamiento:', error)
      console.error('📋 Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
      
      setError(errorMessage)
      
      toast.error(`Error: ${errorMessage}`, {
        duration: 5000
      })
    } finally {
      setIsProcessing(false)
      if (toastId) {
        toast.dismiss(toastId)
      }
      
      // Reset progress after a delay
      setTimeout(() => {
        setProgress(0)
      }, 2000)
    }
  }, [setDashboardMetrics, setLoadingMetrics, setConversations, initializeServices])

  const resetState = useCallback(() => {
    setIsProcessing(false)
    setProgress(0)
    setError(null)
  }, [])

  return {
    processFile,
    isProcessing,
    progress,
    error,
    resetState
  }
} 