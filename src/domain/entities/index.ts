// Re-export all domain entities
export * from './Conversation'
export * from './AnalysisResult'
export * from './WhatsAppMessage'
export * from './DashboardMetrics'

export type { Conversation, ConversationMetadata, ConversationFilters } from './Conversation'
export { ConversationStatus } from './Conversation'
export type { AnalysisResult, SentimentAnalysis, IntentAnalysis, Intent, TimeRangeMetrics } from './AnalysisResult'
export { SentimentLabel, IntentType } from './AnalysisResult'
export type { DashboardMetrics } from './DashboardMetrics'
export type { WhatsAppMessage } from './WhatsAppMessage'

// Re-export interfaces from domain layer
export type { IConversationRepository } from '../interfaces/IConversationRepository'
export type { IAnalysisService, IFileProcessingService, IMessageRepository } from '../interfaces/IAnalysisService'
export type { IFileProcessor, ValidationResult, ProcessResult, ProcessError, ProcessSummary } from '../interfaces/IFileProcessor' 