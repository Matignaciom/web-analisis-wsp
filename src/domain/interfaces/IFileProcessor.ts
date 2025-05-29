import type { Conversation } from '@/domain/entities'

export interface IFileProcessor {
  validateFile(file: File): Promise<ValidationResult>
  processFile(file: File): Promise<ProcessResult>
  getSupportedFormats(): string[]
  getMaxFileSize(): number
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface ProcessResult {
  conversations: Conversation[]
  totalProcessed: number
  errors: ProcessError[]
  summary: ProcessSummary
}

export interface ProcessError {
  row: number
  column: string
  message: string
  severity: 'error' | 'warning'
}

export interface ProcessSummary {
  totalRows: number
  successfulRows: number
  errorRows: number
  processingTime: number
} 