import type { 
  IAnalysisService,
  Conversation, 
  AnalysisResult, 
  SentimentAnalysis,
  IntentAnalysis
} from '@/domain/entities'
import { SentimentLabel, IntentType } from '@/domain/entities'
import { config, analysisConfig } from '@/config/environment'

interface CacheEntry {
  result: AnalysisResult
  timestamp: number
  hash: string
}

interface LocalAnalysisRule {
  keyword: string[]
  sentiment: SentimentLabel
  intent: IntentType
  confidence: number
}

export class OptimizedAnalysisService implements IAnalysisService {
  private cache = new Map<string, CacheEntry>()
  private openaiService: any // Instancia del servicio OpenAI original
  
  // Reglas locales para análisis básico (sin IA)
  private localRules: LocalAnalysisRule[] = [
    // Reglas conservadoras basadas en palabras clave evidentes
    {
      keyword: ['precio', 'costo', 'cuánto cuesta', 'valor', 'cotización'],
      sentiment: SentimentLabel.NEUTRAL,
      intent: IntentType.PRICE_INQUIRY,
      confidence: 0.9
    },
    {
      keyword: ['disponible', 'stock', 'tienen', 'hay', 'existencia'],
      sentiment: SentimentLabel.NEUTRAL,
      intent: IntentType.STOCK_CHECK,
      confidence: 0.9
    },
    {
      keyword: ['comprar', 'adquirir', 'confirmo pedido', 'me interesa comprar', 'proceder con'],
      sentiment: SentimentLabel.POSITIVE,
      intent: IntentType.PURCHASE_INTENT,
      confidence: 0.95
    },
    {
      keyword: ['problema', 'no funciona', 'falla', 'error', 'defecto'],
      sentiment: SentimentLabel.NEGATIVE,
      intent: IntentType.COMPLAINT,
      confidence: 0.9
    },
    {
      keyword: ['ayuda', 'soporte', 'asistencia', 'cómo usar', 'tutorial'],
      sentiment: SentimentLabel.NEUTRAL,
      intent: IntentType.SUPPORT,
      confidence: 0.85
    },
    {
      keyword: ['información', 'detalles', 'especificaciones', 'características'],
      sentiment: SentimentLabel.NEUTRAL,
      intent: IntentType.GENERAL_INFO,
      confidence: 0.8
    }
  ]

  constructor(openaiService?: any) {
    this.openaiService = openaiService
  }

  async analyzeConversation(conversation: Conversation): Promise<AnalysisResult> {
    try {
      // 1. Verificar cache primero
      if (config.openai.localAnalysis.cacheResults) {
        const cached = this.getCachedResult(conversation)
        if (cached) {
          console.log(`📦 Usando resultado en cache para: ${conversation.id}`)
          return cached
        }
      }

      // 2. PRIORIZAR ANÁLISIS CON IA SIEMPRE QUE ESTÉ DISPONIBLE
      if (this.openaiService) {
        console.log(`🤖 Analizando con IA (${config.openai.model}) para: ${conversation.id}`)
        const aiResult = await this.analyzeWithAI(conversation)
        this.cacheResult(conversation, aiResult)
        return aiResult
      }

      // 3. Solo usar análisis local como respaldo si NO hay IA disponible
      if (config.analysis.costOptimization.useLocalAnalysis) {
        const localResult = this.tryLocalAnalysis(conversation)
        if (localResult && localResult.confidence > 0.7) {
          console.log(`🏠 Análisis local como respaldo para: ${conversation.id}`)
          this.cacheResult(conversation, localResult)
          return localResult
        }
      }

      // 4. Fallback final
      console.log(`🔄 Usando análisis de respaldo para: ${conversation.id}`)
      return this.createFallbackAnalysis(conversation)

    } catch (error) {
      console.error(`❌ Error en análisis optimizado ${conversation.id}:`, error)
      return this.createFallbackAnalysis(conversation)
    }
  }

  async analyzeBatch(conversations: Conversation[]): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = []
    
    // Filtrar conversaciones que ya están en cache
    const uncachedConversations = conversations.filter(conv => {
      const cached = this.getCachedResult(conv)
      if (cached) {
        results.push(cached)
        return false
      }
      return true
    })

    if (uncachedConversations.length === 0) {
      return results
    }

    // PRIORIZAR ANÁLISIS CON IA PARA TODO EL LOTE
    if (this.openaiService && uncachedConversations.length > 0) {
      console.log(`🤖 Analizando ${uncachedConversations.length} conversaciones con IA en lotes`)
      
      // Usar análisis en lote optimizado para IA
      if (config.openai.batchAnalysis.enabled && uncachedConversations.length > 3) {
        const batchResults = await this.analyzeBatchWithAI(uncachedConversations)
        results.push(...batchResults)
        return results
      } else {
        // Análisis individual con IA con delay optimizado
        for (const conv of uncachedConversations) {
          const aiResult = await this.analyzeWithAI(conv)
          results.push(aiResult)
          this.cacheResult(conv, aiResult)
          
          // Delay solo si hay más conversaciones
          if (uncachedConversations.indexOf(conv) < uncachedConversations.length - 1) {
            await this.delay(config.openai.batchAnalysis.delayBetweenBatches)
          }
        }
        return results
      }
    }

    // Solo usar análisis local como respaldo si NO hay IA disponible
    const localResults: AnalysisResult[] = []
    const needsFallback: Conversation[] = []

    for (const conv of uncachedConversations) {
      const localResult = this.tryLocalAnalysis(conv)
      if (localResult && localResult.confidence > 0.7) {
        localResults.push(localResult)
        this.cacheResult(conv, localResult)
      } else {
        needsFallback.push(conv)
      }
    }

    results.push(...localResults)

    // Crear análisis de respaldo para conversaciones que no pudieron ser analizadas
    for (const conv of needsFallback) {
      const fallbackResult = this.createFallbackAnalysis(conv)
      results.push(fallbackResult)
      this.cacheResult(conv, fallbackResult)
    }

    return results
  }

  private tryLocalAnalysis(conversation: Conversation): AnalysisResult | null {
    const text = `${conversation.lastMessage} ${conversation.customerName}`.toLowerCase()
    
    let bestMatch: LocalAnalysisRule | null = null
    let maxMatches = 0

    for (const rule of this.localRules) {
      const matches = rule.keyword.filter(keyword => text.includes(keyword)).length
      if (matches > maxMatches) {
        maxMatches = matches
        bestMatch = rule
      }
    }

    if (!bestMatch || maxMatches === 0) {
      return null
    }

    // Calcular métricas adicionales localmente
    const sentiment = this.calculateLocalSentiment(conversation)
    const intent = this.calculateLocalIntent(conversation, bestMatch)

    return {
      id: `local_${conversation.id}_${Date.now()}`,
      conversationId: conversation.id,
      timestamp: new Date(),
      sentiment,
      intent,
      summary: this.generateLocalSummary(conversation),
      keyInsights: this.generateLocalInsights(conversation),
      recommendations: this.generateLocalRecommendations(conversation),
      confidence: Math.min(bestMatch.confidence + (maxMatches * 0.1), 0.95)
    }
  }

  private calculateLocalSentiment(conversation: Conversation): SentimentAnalysis {
    const text = conversation.lastMessage.toLowerCase()
    
    // Palabras positivas y negativas simples
    const positiveWords = ['gracias', 'bien', 'perfecto', 'excelente', 'ok', 'si', 'bueno']
    const negativeWords = ['mal', 'problema', 'error', 'no', 'molesto', 'terrible']
    
    const positiveCount = positiveWords.filter(word => text.includes(word)).length
    const negativeCount = negativeWords.filter(word => text.includes(word)).length
    
    let score = 0
    let label = SentimentLabel.NEUTRAL
    
    if (positiveCount > negativeCount) {
      score = Math.min(0.8, positiveCount * 0.3)
      label = score > 0.5 ? SentimentLabel.POSITIVE : SentimentLabel.NEUTRAL
    } else if (negativeCount > positiveCount) {
      score = Math.max(-0.8, negativeCount * -0.3)
      label = score < -0.5 ? SentimentLabel.NEGATIVE : SentimentLabel.NEUTRAL
    }

    return {
      score,
      label,
      confidence: 0.7,
      keywords: [...positiveWords, ...negativeWords].filter(word => text.includes(word))
    }
  }

  private calculateLocalIntent(_conversation: Conversation, rule: LocalAnalysisRule): IntentAnalysis {
    return {
      primary: {
        type: rule.intent,
        category: this.getIntentCategory(rule.intent),
        description: this.getIntentDescription(rule.intent),
        confidence: rule.confidence
      },
      confidence: rule.confidence
    }
  }

  private generateLocalSummary(conversation: Conversation): string {
    // Verificar si hay datos reales para resumir
    const hasNoMessages = conversation.totalMessages <= 1 && 
      (conversation.lastMessage === '[SIN MENSAJES EN DATOS ORIGINALES]' || 
       conversation.lastMessage === 'No se ha iniciado conversación')
    
    if (hasNoMessages) {
      return `📋 ${conversation.customerName}. Sin mensajes en datos originales. Estado: ${conversation.status}.`
    }
    
    // Generar resumen conservador basado en datos reales
    const messagePrev = conversation.lastMessage.length > 60 
      ? conversation.lastMessage.substring(0, 60) + '...' 
      : conversation.lastMessage
    
    // Detectar intención evidente en el mensaje
    const message = conversation.lastMessage.toLowerCase()
    let intentSummary = ''
    
    if (message.includes('precio') || message.includes('costo')) {
      intentSummary = ' - Consulta de precios'
    } else if (message.includes('comprar') || message.includes('adquirir')) {
      intentSummary = ' - Intención de compra'
    } else if (message.includes('problema') || message.includes('ayuda')) {
      intentSummary = ' - Solicita soporte'
    } else if (message.includes('disponible') || message.includes('stock')) {
      intentSummary = ' - Verifica disponibilidad'
    }
    
    return `📋 ${conversation.customerName} (${conversation.status})${intentSummary}. Último: "${messagePrev}"`
  }

  private generateLocalInsights(conversation: Conversation): string[] {
    const insights = []
    const hasNoMessages = conversation.totalMessages <= 1 && conversation.lastMessage === 'No se ha iniciado conversación'
    
    if (hasNoMessages) {
      insights.push('Sin datos suficientes para generar insights detallados')
      insights.push('Requiere inicio de conversación para análisis completo')
    } else {
      if (conversation.totalMessages > 10) {
        insights.push('Cliente altamente comprometido con muchos mensajes')
      }
      
      if (conversation.status === 'completed') {
        insights.push('Conversión exitosa - proceso optimizado')
      }
      
      if (conversation.status === 'abandoned' && conversation.totalMessages < 3) {
        insights.push('Abandono temprano - posible problema de respuesta inicial')
      }
    }
    
    return insights
  }

  private generateLocalRecommendations(conversation: Conversation): string[] {
    const recommendations = []
    const hasNoMessages = conversation.totalMessages <= 1 && conversation.lastMessage === 'No se ha iniciado conversación'
    
    if (hasNoMessages) {
      recommendations.push('Enviar mensaje inicial personalizado para iniciar conversación')
      recommendations.push('Configurar seguimiento automático si no hay respuesta')
    } else {
      switch (conversation.status) {
        case 'pending':
          recommendations.push('Responder rápidamente para mantener el interés')
          break
        case 'abandoned':
          recommendations.push('Contactar con oferta especial para reactivar')
          break
        case 'completed':
          recommendations.push('Solicitar feedback y ofrecer productos complementarios')
          break
        case 'active':
          recommendations.push('Mantener el momentum y cerrar la venta')
          break
      }
    }
    
    return recommendations
  }

  private async analyzeBatchWithAI(conversations: Conversation[]): Promise<AnalysisResult[]> {
    if (!this.openaiService) {
      return conversations.map(conv => this.createFallbackAnalysis(conv))
    }

    try {
      console.log(`🚀 Análisis en lote de ${conversations.length} conversaciones`)
      
      // Crear prompt optimizado para múltiples conversaciones
      const batchPrompt = this.createBatchPrompt(conversations)
      
      const response = await this.openaiService.openai.chat.completions.create({
        model: analysisConfig.batch.model,
        messages: [
          {
            role: 'system',
            content: 'Analiza múltiples conversaciones de WhatsApp y responde con un JSON array. Sé conciso para ahorrar tokens.'
          },
          {
            role: 'user',
            content: batchPrompt
          }
        ],
        temperature: analysisConfig.batch.temperature,
        max_tokens: analysisConfig.batch.maxTokens
      })

      const results = this.parseBatchResponse(response.choices[0].message.content || '[]', conversations)
      
      // Cachear resultados
      results.forEach((result, index) => {
        this.cacheResult(conversations[index], result)
      })
      
      return results

    } catch (error) {
      console.error('Error en análisis en lote:', error)
      return conversations.map(conv => this.createFallbackAnalysis(conv))
    }
  }

  private createBatchPrompt(conversations: Conversation[]): string {
    const conversationsData = conversations.slice(0, 10).map((conv, index) => 
      `${index + 1}. ID: ${conv.id} | Cliente: ${conv.customerName} | Estado: ${conv.status} | Mensajes: ${conv.totalMessages} | Último: "${conv.lastMessage}"`
    ).join('\n')

    return `Analiza estas conversaciones de WhatsApp de forma concisa:

${conversationsData}

Responde con JSON array con este formato exacto para cada conversación:
[{
  "id": "conversation_id",
  "sentiment": {"score": 0.5, "label": "neutral", "confidence": 0.8},
  "intent": "price_inquiry|stock_check|purchase_intent|complaint|support|general_info",
  "summary": "Resumen muy breve",
  "confidence": 0.8
}]

Máximo 50 caracteres por resumen. Sé preciso y conciso.`
  }

  private parseBatchResponse(response: string, conversations: Conversation[]): AnalysisResult[] {
    try {
      const parsed = JSON.parse(this.cleanJsonResponse(response))
      return Array.isArray(parsed) ? parsed.map((item, index) => 
        this.mapBatchItemToAnalysisResult(item, conversations[index])
      ) : conversations.map(conv => this.createFallbackAnalysis(conv))
    } catch (error) {
      console.error('Error parsing batch response:', error)
      return conversations.map(conv => this.createFallbackAnalysis(conv))
    }
  }

  private mapBatchItemToAnalysisResult(item: any, conversation: Conversation): AnalysisResult {
    return {
      id: `batch_${conversation.id}_${Date.now()}`,
      conversationId: conversation.id,
      timestamp: new Date(),
      sentiment: {
        score: item.sentiment?.score || 0,
        label: this.mapSentimentLabel(item.sentiment?.label) || SentimentLabel.NEUTRAL,
        confidence: item.sentiment?.confidence || 0.7,
        keywords: []
      },
      intent: {
        primary: {
          type: this.mapIntentType(item.intent) || IntentType.GENERAL_INFO,
          category: this.getIntentCategory(this.mapIntentType(item.intent) || IntentType.GENERAL_INFO),
          description: this.getIntentDescription(this.mapIntentType(item.intent) || IntentType.GENERAL_INFO),
          confidence: item.confidence || 0.7
        },
        confidence: item.confidence || 0.7
      },
      summary: item.summary || 'Análisis en lote',
      keyInsights: ['Análisis procesado en lote'],
      recommendations: this.generateLocalRecommendations(conversation),
      confidence: item.confidence || 0.7
    }
  }

  private async analyzeWithAI(conversation: Conversation): Promise<AnalysisResult> {
    if (!this.openaiService) {
      return this.createFallbackAnalysis(conversation)
    }

    // Usar el servicio OpenAI original pero con configuración optimizada
    return await this.openaiService.analyzeConversation(conversation)
  }

  private getCachedResult(conversation: Conversation): AnalysisResult | null {
    const hash = this.generateConversationHash(conversation)
    const cached = this.cache.get(hash)
    
    if (cached && this.isCacheValid(cached)) {
      return cached.result
    }
    
    return null
  }

  private cacheResult(conversation: Conversation, result: AnalysisResult): void {
    if (!config.openai.localAnalysis.cacheResults) return
    
    const hash = this.generateConversationHash(conversation)
    this.cache.set(hash, {
      result,
      timestamp: Date.now(),
      hash
    })
    
    // Limpiar cache viejo
    this.cleanOldCache()
  }

  private generateConversationHash(conversation: Conversation): string {
    return `${conversation.id}_${conversation.lastMessage}_${conversation.totalMessages}_${conversation.status}`
  }

  private isCacheValid(entry: CacheEntry): boolean {
    return (Date.now() - entry.timestamp) < config.openai.localAnalysis.cacheTTL
  }

  private cleanOldCache(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isCacheValid(entry)) {
        this.cache.delete(key)
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Helper methods
  private mapSentimentLabel(label: string): SentimentLabel {
    const labelMap: Record<string, SentimentLabel> = {
      'very_negative': SentimentLabel.VERY_NEGATIVE,
      'negative': SentimentLabel.NEGATIVE,
      'neutral': SentimentLabel.NEUTRAL,
      'positive': SentimentLabel.POSITIVE,
      'very_positive': SentimentLabel.VERY_POSITIVE
    }
    return labelMap[label] || SentimentLabel.NEUTRAL
  }

  private mapIntentType(type: string): IntentType {
    const typeMap: Record<string, IntentType> = {
      'price_inquiry': IntentType.PRICE_INQUIRY,
      'stock_check': IntentType.STOCK_CHECK,
      'purchase_intent': IntentType.PURCHASE_INTENT,
      'complaint': IntentType.COMPLAINT,
      'support': IntentType.SUPPORT,
      'general_info': IntentType.GENERAL_INFO,
      'negotiation': IntentType.NEGOTIATION,
      'follow_up': IntentType.FOLLOW_UP
    }
    return typeMap[type] || IntentType.GENERAL_INFO
  }

  private getIntentCategory(type: IntentType): string {
    const categoryMap: Record<IntentType, string> = {
      [IntentType.PRICE_INQUIRY]: 'Consulta',
      [IntentType.STOCK_CHECK]: 'Inventario',
      [IntentType.PURCHASE_INTENT]: 'Venta',
      [IntentType.COMPLAINT]: 'Soporte',
      [IntentType.SUPPORT]: 'Soporte',
      [IntentType.GENERAL_INFO]: 'Información',
      [IntentType.NEGOTIATION]: 'Venta',
      [IntentType.FOLLOW_UP]: 'Seguimiento'
    }
    return categoryMap[type] || 'General'
  }

  private getIntentDescription(type: IntentType): string {
    const descriptionMap: Record<IntentType, string> = {
      [IntentType.PRICE_INQUIRY]: 'Cliente consulta precios',
      [IntentType.STOCK_CHECK]: 'Verificación de disponibilidad',
      [IntentType.PURCHASE_INTENT]: 'Intención de compra',
      [IntentType.COMPLAINT]: 'Queja o problema',
      [IntentType.SUPPORT]: 'Solicitud de ayuda',
      [IntentType.GENERAL_INFO]: 'Información general',
      [IntentType.NEGOTIATION]: 'Negociación de términos',
      [IntentType.FOLLOW_UP]: 'Seguimiento de venta'
    }
    return descriptionMap[type] || 'Consulta general'
  }

  private cleanJsonResponse(content: string): string {
    let cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '')
    const firstBrace = cleaned.indexOf('[') !== -1 ? cleaned.indexOf('[') : cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf(']') !== -1 ? cleaned.lastIndexOf(']') : cleaned.lastIndexOf('}')
    
    if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1)
    }
    
    return cleaned.trim()
  }

  private createFallbackAnalysis(conversation: Conversation): AnalysisResult {
    const sentiment = this.calculateLocalSentiment(conversation)
    
    return {
      id: `fallback_${conversation.id}_${Date.now()}`,
      conversationId: conversation.id,
      timestamp: new Date(),
      sentiment,
      intent: {
        primary: {
          type: IntentType.GENERAL_INFO,
          category: 'General',
          description: 'Análisis no disponible',
          confidence: 0.3
        },
        confidence: 0.3
      },
      summary: this.generateLocalSummary(conversation),
      keyInsights: this.generateLocalInsights(conversation),
      recommendations: this.generateLocalRecommendations(conversation),
      confidence: 0.5
    }
  }

  // Métodos para compatibilidad con la interfaz IAnalysisService
  async generateSummary(conversations: Conversation[]): Promise<string> {
    const summary = conversations.slice(0, 5).map(conv => 
      `- ${conv.customerName}: ${conv.status} (${conv.totalMessages} msgs)`
    ).join('\n')
    
    return `Resumen de ${conversations.length} conversaciones:\n${summary}\n\nAnálisis generado localmente para ahorrar costos.`
  }

  async generateConversationSummary(conversation: Conversation): Promise<string> {
    // Verificar calidad de datos antes de generar análisis
    const dataQuality = (conversation.metadata as any)?.dataQuality
    const hasIncompleteData = (conversation.metadata as any)?.incompleteData || false
    
    // Si los datos son incompletos, generar resumen conservador
    if (hasIncompleteData || (dataQuality && dataQuality.completenessScore < 0.3)) {
      return `⚠️ Datos limitados: ${conversation.customerName}. Información incompleta en archivo original.`
    }
    
    return this.generateLocalSummary(conversation)
  }

  async generateConversationSuggestion(conversation: Conversation): Promise<string> {
    // Verificar calidad de datos
    const dataQuality = (conversation.metadata as any)?.dataQuality
    const hasIncompleteData = (conversation.metadata as any)?.incompleteData || false
    
    // Si los datos son incompletos, sugerir validación
    if (hasIncompleteData || (dataQuality && dataQuality.completenessScore < 0.3)) {
      return 'Validar y completar información del cliente antes de proceder'
    }
    
    const recommendations = this.generateLocalRecommendations(conversation)
    return recommendations[0] || 'Realizar seguimiento según protocolo estándar'
  }

  async generateInterest(conversation: Conversation): Promise<string> {
    // Verificar calidad de datos
    const dataQuality = (conversation.metadata as any)?.dataQuality
    const hasIncompleteData = (conversation.metadata as any)?.incompleteData || false
    
    // Si los datos son incompletos, no especular
    if (hasIncompleteData || (dataQuality && dataQuality.completenessScore < 0.3)) {
      return 'Datos insuficientes para determinar interés'
    }
    
    const hasNoMessages = conversation.totalMessages <= 1 && 
      (conversation.lastMessage === '[SIN MENSAJES EN DATOS ORIGINALES]' || 
       conversation.lastMessage === 'No se ha iniciado conversación')
    
    if (hasNoMessages) {
      return 'Sin mensajes para evaluar intención'
    }
    
    // Usar análisis local conservador basado en datos reales
    const intent = this.tryLocalAnalysis(conversation)?.intent.primary.type
    
    switch (intent) {
      case IntentType.PRICE_INQUIRY:
        return 'Consulta de precios'
      case IntentType.STOCK_CHECK:
        return 'Verificación de disponibilidad'
      case IntentType.PURCHASE_INTENT:
        return 'Intención de compra expresada'
      case IntentType.COMPLAINT:
        return 'Solicitud de soporte'
      case IntentType.SUPPORT:
        return 'Soporte técnico'
      default:
        // Análisis básico de palabras clave solo en el mensaje real
        const message = conversation.lastMessage.toLowerCase()
        if (message.includes('precio') || message.includes('costo')) {
          return 'Consulta de precios'
        } else if (message.includes('disponible') || message.includes('stock')) {
          return 'Verificación de disponibilidad'
        } else if (message.includes('información') || message.includes('detalles')) {
          return 'Solicitud de información'
        } else {
          return 'Requiere aclaración'
        }
    }
  }

  async generateSalesPotential(conversation: Conversation): Promise<'low' | 'medium' | 'high'> {
    // Verificar calidad de datos
    const dataQuality = (conversation.metadata as any)?.dataQuality
    const hasIncompleteData = (conversation.metadata as any)?.incompleteData || false
    
    // Si los datos son incompletos, potencial bajo por defecto
    if (hasIncompleteData || (dataQuality && dataQuality.completenessScore < 0.5)) {
      return 'low'
    }
    
    // Lógica conservadora basada solo en datos evidentes
    if (conversation.status === 'completed') return 'high'
    if (conversation.status === 'abandoned') return 'low'
    
    // Considerar actividad real documentada
    if (conversation.totalMessages > 10) return 'medium'
    if (conversation.totalMessages > 5) return 'medium'
    
    // Análizar mensaje real para evidencia de intención
    const message = conversation.lastMessage.toLowerCase()
    if (message.includes('comprar') || message.includes('confirmo')) return 'high'
    if (message.includes('precio') || message.includes('información')) return 'medium'
    
    return 'low'
  }
} 