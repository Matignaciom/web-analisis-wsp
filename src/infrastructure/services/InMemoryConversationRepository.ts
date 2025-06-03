import type { 
  IConversationRepository,
  Conversation,
  ConversationFilters
} from '@/domain/entities'
import { ConversationStatus } from '@/domain/entities'

export class InMemoryConversationRepository implements IConversationRepository {
  private conversations: Map<string, Conversation> = new Map()
  private nextId = 1

  async getAll(filters?: ConversationFilters): Promise<Conversation[]> {
    let conversations = Array.from(this.conversations.values())

    if (filters) {
      // Filtrar por estado
      if (filters.status && filters.status.length > 0) {
        conversations = conversations.filter(conv => 
          filters.status!.includes(conv.status)
        )
      }

      // Filtrar por rango de fechas
      if (filters.dateRange) {
        conversations = conversations.filter(conv => {
          const startDate = conv.startDate
          return startDate >= filters.dateRange!.start && 
                 startDate <= filters.dateRange!.end
        })
      }

      // Filtrar por agente
      if (filters.agent) {
        conversations = conversations.filter(conv => 
          conv.assignedAgent === filters.agent
        )
      }

      // Búsqueda por término
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase()
        conversations = conversations.filter(conv =>
          conv.customerName.toLowerCase().includes(term) ||
          conv.customerPhone.includes(term) ||
          conv.lastMessage.toLowerCase().includes(term) ||
          (conv.assignedAgent && conv.assignedAgent.toLowerCase().includes(term))
        )
      }
    }

    // Ordenar por fecha más reciente
    return conversations.sort((a, b) => 
      b.startDate.getTime() - a.startDate.getTime()
    )
  }

  async getById(id: string): Promise<Conversation | null> {
    return this.conversations.get(id) || null
  }

  async create(conversationData: Omit<Conversation, 'id'>): Promise<Conversation> {
    const id = `conv_${this.nextId++}_${Date.now()}`
    const conversation: Conversation = {
      ...conversationData,
      id
    }
    
    this.conversations.set(id, conversation)
    return conversation
  }

  async update(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    const existingConversation = this.conversations.get(id)
    if (!existingConversation) {
      throw new Error(`Conversación con ID ${id} no encontrada`)
    }

    const updatedConversation: Conversation = {
      ...existingConversation,
      ...updates,
      id // Asegurar que el ID no cambie
    }

    this.conversations.set(id, updatedConversation)
    return updatedConversation
  }

  async delete(id: string): Promise<void> {
    if (!this.conversations.has(id)) {
      throw new Error(`Conversación con ID ${id} no encontrada`)
    }
    this.conversations.delete(id)
  }

  async getByStatus(status: ConversationStatus): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter(conv => conv.status === status)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
  }

  async getTotalCount(): Promise<number> {
    return this.conversations.size
  }

  async getConversationsByDateRange(start: Date, end: Date): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter(conv => conv.startDate >= start && conv.startDate <= end)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
  }

  // Métodos adicionales para manejo de datos
  async bulkCreate(conversations: Omit<Conversation, 'id'>[]): Promise<Conversation[]> {
    const createdConversations: Conversation[] = []
    
    for (const conversationData of conversations) {
      const conversation = await this.create(conversationData)
      createdConversations.push(conversation)
    }
    
    return createdConversations
  }

  async clear(): Promise<void> {
    this.conversations.clear()
    this.nextId = 1
  }

  async getStats(): Promise<{
    total: number
    byStatus: Record<ConversationStatus, number>
    byAgent: Record<string, number>
    todayCount: number
    weekCount: number
    monthCount: number
  }> {
    const conversations = Array.from(this.conversations.values())
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Contadores por estado
    const byStatus: Record<ConversationStatus, number> = {
      [ConversationStatus.ACTIVE]: 0,
      [ConversationStatus.COMPLETED]: 0,
      [ConversationStatus.ABANDONED]: 0,
      [ConversationStatus.PENDING]: 0
    }

    // Contadores por agente
    const byAgent: Record<string, number> = {}

    let todayCount = 0
    let weekCount = 0
    let monthCount = 0

    conversations.forEach(conv => {
      // Contar por estado
      byStatus[conv.status]++

      // Contar por agente
      const agent = conv.assignedAgent || 'Sin asignar'
      byAgent[agent] = (byAgent[agent] || 0) + 1

      // Contar por fecha
      if (conv.startDate >= today) todayCount++
      if (conv.startDate >= weekAgo) weekCount++
      if (conv.startDate >= monthAgo) monthCount++
    })

    return {
      total: conversations.length,
      byStatus,
      byAgent,
      todayCount,
      weekCount,
      monthCount
    }
  }
} 