import type { Conversation, ConversationFilters, ConversationStatus } from '@/domain/entities'

export interface IConversationRepository {
  getAll(filters?: ConversationFilters): Promise<Conversation[]>
  getById(id: string): Promise<Conversation | null>
  create(conversation: Omit<Conversation, 'id'>): Promise<Conversation>
  update(id: string, updates: Partial<Conversation>): Promise<Conversation>
  delete(id: string): Promise<void>
  getByStatus(status: ConversationStatus): Promise<Conversation[]>
  getTotalCount(): Promise<number>
  getConversationsByDateRange(start: Date, end: Date): Promise<Conversation[]>
} 