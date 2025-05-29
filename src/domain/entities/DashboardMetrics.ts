export interface DashboardMetrics {
  totalConversations: number
  completedSales: number
  abandonedChats: number
  averageResponseTime: string
  conversionRate: number
  satisfactionScore: number
  responseTimeMetrics?: {
    fastest: string
    slowest: string
    median: string
  }
  timeRangeAnalysis?: {
    dailyActivity: Array<{
      date: string
      conversations: number
      conversions: number
    }>
    peakHours: Array<{
      hour: number
      activity: number
    }>
  }
  statusBreakdown?: {
    pending: number
    inProgress: number
    completed: number
    cancelled: number
  }
} 