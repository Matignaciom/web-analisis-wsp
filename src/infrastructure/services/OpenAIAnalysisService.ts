import OpenAI from 'openai'
import type { 
  IAnalysisService,
  Conversation, 
  AnalysisResult, 
  SentimentAnalysis,
  IntentAnalysis,
  Intent
} from '@/domain/entities'
import { SentimentLabel, IntentType } from '@/domain/entities'

export class OpenAIAnalysisService implements IAnalysisService {
  private openai: OpenAI
  private model: string

  constructor(apiKey: string, model: string = 'gpt-4-turbo-preview') {
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Solo para desarrollo, en producción usar backend
    })
    this.model = model
  }

  async analyzeConversation(conversation: Conversation): Promise<AnalysisResult> {
    try {
      console.log(`🔍 Iniciando análisis de conversación: ${conversation.id}`)
      
      const prompt = this.buildAnalysisPrompt(conversation)
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Eres un analista de conversaciones experto. Responde ÚNICAMENTE con JSON válido, sin markdown ni explicaciones adicionales.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      })

      const rawContent = response.choices[0].message.content || '{}'
      console.log(`📄 Respuesta cruda de OpenAI:`, rawContent.substring(0, 200) + '...')
      
      const cleanedContent = this.cleanJsonResponse(rawContent)
      console.log(`🧹 Contenido limpiado:`, cleanedContent.substring(0, 200) + '...')
      
      const analysis = JSON.parse(cleanedContent)
      console.log(`✅ Análisis parseado exitosamente para conversación: ${conversation.id}`)
      
      return this.mapToAnalysisResult(conversation, analysis)
    } catch (error) {
      console.error(`❌ Error analizando conversación ${conversation.id}:`, error)
      
      if (error instanceof SyntaxError) {
        console.error('📋 Error de parsing JSON. Respuesta cruda:', error.message)
      }
      
      if (error instanceof Error && error.message.includes('API key')) {
        console.error('🔐 Error de API key de OpenAI. Verifica la configuración.')
      }
      
      console.log(`🔄 Usando análisis de respaldo para conversación: ${conversation.id}`)
      return this.createFallbackAnalysis(conversation)
    }
  }

  async analyzeBatch(conversations: Conversation[]): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = []
    
    // Procesar en lotes de 5 para evitar límites de API
    for (let i = 0; i < conversations.length; i += 5) {
      const batch = conversations.slice(i, i + 5)
      const batchPromises = batch.map(conv => this.analyzeConversation(conv))
      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          results.push(this.createFallbackAnalysis(batch[index]))
        }
      })
      
      // Pausa para evitar rate limiting
      if (i + 5 < conversations.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    return results
  }

  async generateSummary(conversations: Conversation[]): Promise<string> {
    try {
      const summaryData = this.prepareSummaryData(conversations)
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Eres un analista de datos experto. Genera resúmenes ejecutivos claros y accionables para equipos de ventas y servicio al cliente.'
          },
          {
            role: 'user',
            content: `Genera un resumen ejecutivo de estas ${conversations.length} conversaciones de WhatsApp:
            
            ${summaryData}
            
            El resumen debe incluir:
            - Tendencias generales de sentimiento
            - Principales intenciones de los clientes
            - Oportunidades de mejora
            - Recomendaciones estratégicas
            
            Máximo 300 palabras, enfocado en insights accionables.`
          }
        ],
        temperature: 0.5,
        max_tokens: 800
      })

      return response.choices[0].message.content || 'No se pudo generar el resumen'
    } catch (error) {
      console.error('Error generating summary:', error)
      return 'Error al generar el resumen. Intenta nuevamente.'
    }
  }

  private buildAnalysisPrompt(conversation: Conversation): string {
    return `Analiza esta conversación de WhatsApp:

**Cliente:** ${conversation.customerName} (${conversation.customerPhone})
**Fecha:** ${conversation.startDate.toLocaleDateString()}
**Estado:** ${conversation.status}
**Total mensajes:** ${conversation.totalMessages}
**Último mensaje:** ${conversation.lastMessage}
**Agente asignado:** ${conversation.assignedAgent || 'No asignado'}
**Metadatos:** ${JSON.stringify(conversation.metadata)}

Proporciona un análisis en este formato JSON exacto:
{
  "sentiment": {
    "score": number_between_-1_and_1,
    "label": "very_negative|negative|neutral|positive|very_positive",
    "confidence": number_between_0_and_1,
    "keywords": ["palabra1", "palabra2", "palabra3"]
  },
  "intent": {
    "primary": {
      "type": "price_inquiry|stock_check|purchase_intent|complaint|support|general_info|negotiation|follow_up",
      "category": "string",
      "description": "string",
      "confidence": number_between_0_and_1,
      "parameters": {}
    },
    "secondary": [],
    "confidence": number_between_0_and_1
  },
  "summary": "Resumen conciso de la conversación",
  "keyInsights": ["insight1", "insight2", "insight3"],
  "recommendations": ["recomendación1", "recomendación2", "recomendación3"],
  "confidence": number_between_0_and_1
}`
  }

  private cleanJsonResponse(content: string): string {
    // Remover bloques de código markdown
    let cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '')
    
    // Remover cualquier texto antes del primer { y después del último }
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')
    
    if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1)
    }
    
    return cleaned.trim()
  }

  private mapToAnalysisResult(conversation: Conversation, analysis: any): AnalysisResult {
    return {
      id: `analysis_${conversation.id}_${Date.now()}`,
      conversationId: conversation.id,
      timestamp: new Date(),
      sentiment: this.mapSentiment(analysis.sentiment),
      intent: this.mapIntent(analysis.intent),
      summary: analysis.summary || 'Resumen no disponible',
      keyInsights: analysis.keyInsights || [],
      recommendations: analysis.recommendations || [],
      confidence: analysis.confidence || 0.5
    }
  }

  private mapSentiment(sentiment: any): SentimentAnalysis {
    return {
      score: sentiment?.score || 0,
      label: this.mapSentimentLabel(sentiment?.label),
      confidence: sentiment?.confidence || 0.5,
      keywords: sentiment?.keywords || []
    }
  }

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

  private mapIntent(intent: any): IntentAnalysis {
    return {
      primary: this.mapSingleIntent(intent?.primary),
      secondary: intent?.secondary?.map((i: any) => this.mapSingleIntent(i)) || [],
      confidence: intent?.confidence || 0.5
    }
  }

  private mapSingleIntent(intent: any): Intent {
    return {
      type: this.mapIntentType(intent?.type),
      category: intent?.category || 'General',
      description: intent?.description || 'Sin descripción',
      confidence: intent?.confidence || 0.5,
      parameters: intent?.parameters || {}
    }
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

  private createFallbackAnalysis(conversation: Conversation): AnalysisResult {
    return {
      id: `fallback_${conversation.id}_${Date.now()}`,
      conversationId: conversation.id,
      timestamp: new Date(),
      sentiment: {
        score: 0,
        label: SentimentLabel.NEUTRAL,
        confidence: 0.3,
        keywords: []
      },
      intent: {
        primary: {
          type: IntentType.GENERAL_INFO,
          category: 'General',
          description: 'Análisis no disponible',
          confidence: 0.3
        },
        confidence: 0.3
      },
      summary: 'Análisis automático no disponible',
      keyInsights: ['Requiere análisis manual'],
      recommendations: ['Revisar conversación manualmente'],
      confidence: 0.3
    }
  }

  private prepareSummaryData(conversations: Conversation[]): string {
    return conversations.slice(0, 10).map(conv => 
      `- ${conv.customerName}: ${conv.status} (${conv.totalMessages} msgs) - "${conv.lastMessage}"`
    ).join('\n')
  }

  async generateConversationSummary(conversation: Conversation): Promise<string> {
    try {
      // Verificar si no hay mensajes suficientes
      const hasNoMessages = conversation.totalMessages <= 1 && conversation.lastMessage === 'No se ha iniciado conversación'
      
      if (hasNoMessages) {
        return `No hay mensajes registrados para analizar. Conversación con ${conversation.customerName} está marcada como ${conversation.status === 'pending' ? 'pendiente' : conversation.status}.`
      }
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente especializado en resumir conversaciones de servicio al cliente. Genera resúmenes concisos y útiles.'
          },
          {
            role: 'user',
            content: `Resume esta conversación de WhatsApp de manera concisa:

**Cliente:** ${conversation.customerName}
**Teléfono:** ${conversation.customerPhone}
**Estado:** ${conversation.status}
**Total mensajes:** ${conversation.totalMessages}
**Último mensaje:** ${conversation.lastMessage}
**Agente:** ${conversation.assignedAgent || 'No asignado'}

Genera un resumen de máximo 100 caracteres que capture la esencia de la conversación.`
          }
        ],
        temperature: 0.4,
        max_tokens: 150
      })

      return response.choices[0].message.content?.trim() || 'Resumen no disponible'
    } catch (error) {
      console.error('Error generando resumen:', error)
      return `${conversation.status === 'completed' ? 'Cliente contactado' : 'Conversación'} con ${conversation.customerName}`
    }
  }

  async generateConversationSuggestion(conversation: Conversation): Promise<string> {
    try {
      // Verificar si no hay mensajes suficientes
      const hasNoMessages = conversation.totalMessages <= 1 && conversation.lastMessage === 'No se ha iniciado conversación'
      
      if (hasNoMessages) {
        return 'Enviar mensaje inicial personalizado para iniciar conversación'
      }
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Eres un consultor de ventas experto. Genera sugerencias específicas y accionables para seguimiento de clientes.'
          },
          {
            role: 'user',
            content: `Basándote en esta conversación, sugiere la mejor acción de seguimiento:

**Cliente:** ${conversation.customerName}
**Estado:** ${conversation.status}
**Total mensajes:** ${conversation.totalMessages}
**Último mensaje:** ${conversation.lastMessage}
**Fecha:** ${conversation.startDate.toLocaleDateString()}

Genera UNA sugerencia específica de máximo 120 caracteres para el próximo contacto o acción.`
          }
        ],
        temperature: 0.5,
        max_tokens: 200
      })

      return response.choices[0].message.content?.trim() || 'Realizar seguimiento personalizado'
    } catch (error) {
      console.error('Error generando sugerencia:', error)
      
      // Sugerencias de respaldo basadas en el estado
      switch (conversation.status) {
        case 'completed':
          return 'Solicitar feedback y ofertas complementarias'
        case 'abandoned':
          return 'Contactar con oferta especial o descuento'
        case 'pending':
          return 'Responder rápidamente y agendar llamada'
        case 'active':
          return 'Mantener seguimiento activo y cerrar venta'
        default:
          return 'Realizar seguimiento personalizado según contexto'
      }
    }
  }

  async generateInterest(conversation: Conversation): Promise<string> {
    try {
      // Verificar si no hay mensajes suficientes
      const hasNoMessages = conversation.totalMessages <= 1 && conversation.lastMessage === 'No se ha iniciado conversación'
      
      if (hasNoMessages) {
        return 'No identificado (falta de mensajes para evaluar intención)'
      }
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Identifica el principal interés o necesidad del cliente basándote en la conversación.'
          },
          {
            role: 'user',
            content: `Identifica el interés principal del cliente:

**Último mensaje:** ${conversation.lastMessage}
**Total mensajes:** ${conversation.totalMessages}
**Estado:** ${conversation.status}

Responde con UNA palabra o frase corta (máximo 30 caracteres) que describa el interés principal.`
          }
        ],
        temperature: 0.3,
        max_tokens: 50
      })

      return response.choices[0].message.content?.trim() || 'Información general'
    } catch (error) {
      console.error('Error generando interés:', error)
      
      // Determinar interés basado en palabras clave del último mensaje
      const message = conversation.lastMessage.toLowerCase()
      if (message.includes('precio') || message.includes('costo') || message.includes('cuanto')) {
        return 'Consulta de precios'
      } else if (message.includes('stock') || message.includes('disponible') || message.includes('tienen')) {
        return 'Verificación de stock'
      } else if (message.includes('comprar') || message.includes('pedir') || message.includes('quiero')) {
        return 'Intención de compra'
      } else if (message.includes('problema') || message.includes('ayuda') || message.includes('soporte')) {
        return 'Soporte técnico'
      } else {
        return 'Información general'
      }
    }
  }

  async generateSalesPotential(conversation: Conversation): Promise<'low' | 'medium' | 'high'> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Evalúa el potencial de venta basándote en la conversación. Responde solo con: low, medium, o high'
          },
          {
            role: 'user',
            content: `Evalúa el potencial de venta:

**Estado:** ${conversation.status}
**Total mensajes:** ${conversation.totalMessages}
**Último mensaje:** ${conversation.lastMessage}

¿Cuál es el potencial de venta? Responde solo con: low, medium, o high`
          }
        ],
        temperature: 0.2,
        max_tokens: 10
      })

      const result = response.choices[0].message.content?.trim().toLowerCase()
      if (result === 'high' || result === 'medium' || result === 'low') {
        return result as 'low' | 'medium' | 'high'
      }
      return 'medium'
    } catch (error) {
      console.error('Error evaluando potencial de venta:', error)
      
      // Lógica de respaldo
      if (conversation.status === 'completed') return 'high'
      if (conversation.status === 'abandoned') return 'low'
      if (conversation.totalMessages > 10) return 'high'
      if (conversation.totalMessages > 5) return 'medium'
      return 'low'
    }
  }
}