export interface Conversation {
  id: string
  customerName: string
  customerPhone: string
  startDate: Date
  endDate?: Date
  status: ConversationStatus
  totalMessages: number
  lastMessage: string
  assignedAgent?: string
  tags: string[]
  metadata: ConversationMetadata
}

export enum ConversationStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  PENDING = 'pending'
}

export interface ConversationMetadata {
  source: string
  responseTime: number // en minutos
  satisfaction?: number // 1-5
  totalPurchaseValue?: number
  conversionRate?: number
}

export interface ConversationFilters {
  status?: ConversationStatus[]
  dateRange?: {
    start: Date
    end: Date
  }
  agent?: string
  searchTerm?: string
} 