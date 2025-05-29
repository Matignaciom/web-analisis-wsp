import type { IFileProcessor } from '@/domain/interfaces/IFileProcessor'
import type { IConversationRepository } from '@/domain/interfaces/IConversationRepository'
import type { IAnalysisService } from '@/domain/interfaces/IAnalysisService'

export class ProcessFileUseCase {
  constructor(
    private fileProcessor: IFileProcessor,
    private conversationRepository: IConversationRepository,
    private analysisService: IAnalysisService
  ) {}

  async execute(file: File): Promise<ProcessFileResult> {
    try {
      // 1. Validar archivo
      const validation = await this.fileProcessor.validateFile(file)
      if (!validation.isValid) {
        throw new Error(`Archivo inválido: ${validation.errors.join(', ')}`)
      }

      // 2. Procesar archivo
      const processResult = await this.fileProcessor.processFile(file)
      
      // 3. Guardar conversaciones
      const savedConversations = []
      for (const conversation of processResult.conversations) {
        const saved = await this.conversationRepository.create(conversation)
        savedConversations.push(saved)
      }

      // 4. Analizar con IA (async)
      this.analyzeConversationsAsync(savedConversations.map(c => c.id))

      return {
        success: true,
        totalProcessed: processResult.totalProcessed,
        conversationsCreated: savedConversations.length,
        errors: processResult.errors,
        summary: processResult.summary
      }
    } catch (error) {
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
          processingTime: 0
        }
      }
    }
  }

  private async analyzeConversationsAsync(conversationIds: string[]): Promise<void> {
    // Análisis en background para no bloquear la UI
    for (const id of conversationIds) {
      try {
        const conversation = await this.conversationRepository.getById(id)
        if (conversation) {
          await this.analysisService.analyzeConversation(conversation)
        }
      } catch (error) {
        console.error(`Error analizando conversación ${id}:`, error)
      }
    }
  }
}

export interface ProcessFileResult {
  success: boolean
  error?: string
  totalProcessed: number
  conversationsCreated: number
  errors: Array<{ row: number; message: string; severity: 'error' | 'warning' }>
  summary: {
    totalRows: number
    successfulRows: number
    errorRows: number
    processingTime: number
  }
} 