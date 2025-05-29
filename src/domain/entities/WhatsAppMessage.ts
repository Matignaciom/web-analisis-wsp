export interface WhatsAppMessage {
  id: string
  timestamp: Date
  sender: string
  receiver: string
  content: string
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document'
  isFromCustomer: boolean
  conversationId: string
} 