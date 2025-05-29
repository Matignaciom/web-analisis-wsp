export interface AnalysisResult {
  id: string
  conversationId: string
  timestamp: Date
  sentiment: SentimentAnalysis
  intent: IntentAnalysis
  summary: string
  keyInsights: string[]
  recommendations: string[]
  confidence: number // 0-1
}

export interface SentimentAnalysis {
  score: number // -1 to 1
  label: SentimentLabel
  confidence: number
  keywords: string[]
}

export enum SentimentLabel {
  VERY_NEGATIVE = 'very_negative',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
  POSITIVE = 'positive',
  VERY_POSITIVE = 'very_positive'
}

export interface IntentAnalysis {
  primary: Intent
  secondary?: Intent[]
  confidence: number
}

export interface Intent {
  type: IntentType
  category: string
  description: string
  confidence: number
  parameters?: Record<string, string | number | boolean>
}

export enum IntentType {
  PRICE_INQUIRY = 'price_inquiry',
  STOCK_CHECK = 'stock_check',
  PURCHASE_INTENT = 'purchase_intent',
  COMPLAINT = 'complaint',
  SUPPORT = 'support',
  GENERAL_INFO = 'general_info',
  NEGOTIATION = 'negotiation',
  FOLLOW_UP = 'follow_up'
}

export interface TimeRangeMetrics {
  period: string
  previousPeriod: string
  growth: number
  trend: 'up' | 'down' | 'stable'
} 