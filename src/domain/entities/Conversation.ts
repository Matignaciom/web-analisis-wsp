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
  aiSummary?: string
  aiSuggestion?: string
  interest?: string
  salesPotential?: 'low' | 'medium' | 'high'
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
  dataQuality?: {
    hasRealName: boolean
    hasRealPhone: boolean
    hasRealDate: boolean
    hasRealStatus: boolean
    hasRealMessageCount: boolean
    hasRealMessage: boolean
    hasRealAgent: boolean
    completenessScore: number
  }
  originalRowNumber?: number
  incompleteData?: boolean
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