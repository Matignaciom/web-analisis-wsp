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
}