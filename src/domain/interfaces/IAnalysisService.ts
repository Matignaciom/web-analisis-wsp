import type { Conversation, AnalysisResult, ConversationFilters } from '@/domain/entities'

export interface IAnalysisService {
  analyzeConversation(conversation: Conversation): Promise<AnalysisResult>
  analyzeBatch(conversations: Conversation[]): Promise<AnalysisResult[]>
  generateSummary(conversations: Conversation[]): Promise<string>
}

export interface IFileProcessingService {
  parseExcelFile(file: File): Promise<Conversation[]>
  parseCsvFile(file: File): Promise<Conversation[]>
  exportToExcel(data: AnalysisResult[]): Promise<Blob>
  exportToCsv(data: AnalysisResult[]): Promise<Blob>
}

export interface IMessageRepository {
  saveConversations(conversations: Conversation[]): Promise<void>
  getConversations(filters?: ConversationFilters): Promise<Conversation[]>
  getAnalysisResults(conversationIds: string[]): Promise<AnalysisResult[]>
  saveAnalysisResults(results: AnalysisResult[]): Promise<void>
} 