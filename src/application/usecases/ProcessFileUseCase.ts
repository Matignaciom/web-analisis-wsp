import type { IFileProcessor } from '@/domain/interfaces/IFileProcessor'
import type { IConversationRepository } from '@/domain/interfaces/IConversationRepository'
import type { IAnalysisService } from '@/domain/interfaces/IAnalysisService'
import { SupabaseStorageService } from '@/infrastructure/services/SupabaseStorageService'

export class ProcessFileUseCase {
  private storageService: SupabaseStorageService

  constructor(
    private fileProcessor: IFileProcessor,
    private conversationRepository: IConversationRepository,
    private analysisService: IAnalysisService
  ) {
    this.storageService = new SupabaseStorageService()
  }

  async execute(file: File): Promise<ProcessFileResult> {
    const startTime = Date.now()
    let uploadedFilePath: string | null = null

    try {
      // 1. Subir archivo a Supabase Storage primero
      const uploadResult = await this.storageService.uploadFile(file)
      if (!uploadResult.success) {
        throw new Error(`Error al subir archivo: ${uploadResult.error}`)
      }
      uploadedFilePath = uploadResult.path

      // 2. Validar archivo
      const validation = await this.fileProcessor.validateFile(file)
      if (!validation.isValid) {
        // Si la validación falla, limpiar el archivo subido
        if (uploadedFilePath) {
          await this.storageService.deleteFile(uploadedFilePath)
        }
        throw new Error(`Archivo inválido: ${validation.errors.join(', ')}`)
      }

      // 3. Procesar archivo
      const processResult = await this.fileProcessor.processFile(file)
      
      // 4. Guardar conversaciones
      const savedConversations = []
      for (const conversation of processResult.conversations) {
        // Agregar metadata del archivo subido
        const conversationWithMetadata = {
          ...conversation,
          metadata: {
            ...conversation.metadata,
            sourceFile: {
              path: uploadedFilePath,
              name: file.name,
              size: file.size,
              uploadedAt: new Date()
            }
          }
        }
        const saved = await this.conversationRepository.create(conversationWithMetadata)
        savedConversations.push(saved)
      }

      // 5. Analizar con IA (async)
      this.analyzeConversationsAsync(savedConversations.map(c => c.id))

      const processingTime = Date.now() - startTime

      return {
        success: true,
        totalProcessed: processResult.totalProcessed,
        conversationsCreated: savedConversations.length,
        errors: processResult.errors,
        uploadedFile: {
          path: uploadedFilePath,
          name: file.name,
          size: file.size
        },
        summary: {
          totalRows: processResult.summary.totalRows,
          successfulRows: processResult.summary.successfulRows,
          errorRows: processResult.summary.errorRows,
          processingTime
        }
      }
    } catch (error) {
      // Si hay error, limpiar archivo subido
      if (uploadedFilePath) {
        try {
          await this.storageService.deleteFile(uploadedFilePath)
        } catch (cleanupError) {
          console.error('Error limpiando archivo tras fallo:', cleanupError)
        }
      }

      const processingTime = Date.now() - startTime
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        totalProcessed: 0,
        conversationsCreated: 0,
        errors: [],
        summary: {
          totalRows: 0,
          successfulRows: 0,
          errorRows: 0,
          processingTime
        }
      }
    }
  }

  /**
   * Procesa un archivo que ya está en Supabase Storage
   */
  async executeFromStorage(filePath: string, fileName: string): Promise<ProcessFileResult> {
    const startTime = Date.now()

    try {
      // 1. Descargar archivo desde Supabase
      const fileBlob = await this.storageService.downloadFile(filePath)
      if (!fileBlob) {
        throw new Error('No se pudo descargar el archivo desde el storage')
      }

      // Convertir Blob a File
      const file = new File([fileBlob], fileName, { type: fileBlob.type })

      // 2. Validar archivo
      const validation = await this.fileProcessor.validateFile(file)
      if (!validation.isValid) {
        throw new Error(`Archivo inválido: ${validation.errors.join(', ')}`)
      }

      // 3. Procesar archivo
      const processResult = await this.fileProcessor.processFile(file)
      
      // 4. Guardar conversaciones con metadata del storage
      const savedConversations = []
      for (const conversation of processResult.conversations) {
        const conversationWithMetadata = {
          ...conversation,
          metadata: {
            ...conversation.metadata,
            sourceFile: {
              path: filePath,
              name: fileName,
              size: file.size,
              uploadedAt: new Date()
            }
          }
        }
        const saved = await this.conversationRepository.create(conversationWithMetadata)
        savedConversations.push(saved)
      }

      // 5. Analizar con IA (async)
      this.analyzeConversationsAsync(savedConversations.map(c => c.id))

      const processingTime = Date.now() - startTime

      return {
        success: true,
        totalProcessed: processResult.totalProcessed,
        conversationsCreated: savedConversations.length,
        errors: processResult.errors,
        uploadedFile: {
          path: filePath,
          name: fileName,
          size: file.size
        },
        summary: {
          totalRows: processResult.summary.totalRows,
          successfulRows: processResult.summary.successfulRows,
          errorRows: processResult.summary.errorRows,
          processingTime
        }
      }
    } catch (error) {
      const processingTime = Date.now() - startTime
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        totalProcessed: 0,
        conversationsCreated: 0,
        errors: [],
        summary: {
          totalRows: 0,
          successfulRows: 0,
          errorRows: 0,
          processingTime
        }
      }
    }
  }

  private async analyzeConversationsAsync(conversationIds: string[]): Promise<void> {
    console.log(`🤖 Iniciando análisis de IA para ${conversationIds.length} conversaciones...`)
    
    // Análisis en background para no bloquear la UI
    for (const id of conversationIds) {
      try {
        const conversation = await this.conversationRepository.getById(id)
        if (conversation) {
          console.log(`🔍 Analizando conversación: ${conversation.customerName}`)
          
          // Generar análisis completo de IA
          const [summary, suggestion, interest, salesPotential] = await Promise.all([
            this.analysisService.generateConversationSummary(conversation),
            this.analysisService.generateConversationSuggestion(conversation),
            this.analysisService.generateInterest(conversation),
            this.analysisService.generateSalesPotential(conversation)
          ])
          
          // Actualizar conversación con los resultados de IA
          const updatedConversation = {
            ...conversation,
            aiSummary: summary,
            aiSuggestion: suggestion,
            interest: interest,
            salesPotential: salesPotential
          }
          
          await this.conversationRepository.update(id, updatedConversation)
          console.log(`✅ Análisis IA completado para: ${conversation.customerName}`)
          
          // Pausa breve para evitar sobrecarga de API
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`❌ Error analizando conversación ${id}:`, error)
        
        // En caso de error, actualizar con valores por defecto
        try {
          const conversation = await this.conversationRepository.getById(id)
          if (conversation) {
            const fallbackUpdate = {
              ...conversation,
              aiSummary: `Conversación con ${conversation.customerName} - ${conversation.status}`,
              aiSuggestion: 'Realizar seguimiento personalizado según el contexto de la conversación',
              interest: 'Información general',
              salesPotential: conversation.status === 'completed' ? 'high' as const : 'medium' as const
            }
            await this.conversationRepository.update(id, fallbackUpdate)
            console.log(`🔄 Análisis de respaldo aplicado para: ${conversation.customerName}`)
          }
        } catch (fallbackError) {
          console.error(`❌ Error aplicando análisis de respaldo para ${id}:`, fallbackError)
        }
      }
    }
    
    console.log(`🎉 Análisis de IA completado para todas las conversaciones`)
  }
}

export interface ProcessFileResult {
  success: boolean
  error?: string
  totalProcessed: number
  conversationsCreated: number
  errors: Array<{ row: number; message: string; severity: 'error' | 'warning' }>
  uploadedFile?: {
    path: string
    name: string
    size: number
  }
  summary: {
    totalRows: number
    successfulRows: number
    errorRows: number
    processingTime: number
  }
} 