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
      // Verificar calidad de datos antes de generar análisis
      const dataQuality = (conversation.metadata as any)?.dataQuality
      const hasIncompleteData = (conversation.metadata as any)?.incompleteData || false
      
      // Si los datos son incompletos, generar resumen basado en lo disponible
      if (hasIncompleteData || (dataQuality && dataQuality.completenessScore < 0.3)) {
        return `⚠️ Datos limitados: ${conversation.customerName}. Información incompleta en archivo original. Se requiere validación manual.`
      }
      
      // Verificar si hay mensajes suficientes para análisis
      const hasNoMessages = conversation.totalMessages <= 1 && 
        (conversation.lastMessage === '[SIN MENSAJES EN DATOS ORIGINALES]' || 
         conversation.lastMessage === 'No se ha iniciado conversación')
      
      if (hasNoMessages) {
        return `📋 Cliente: ${conversation.customerName}. Sin historial de mensajes en datos originales. Estado actual: ${conversation.status}. Requiere contacto inicial.`
      }
      
      // Solo usar IA si hay datos reales suficientes
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `Eres un asistente especializado en resumir conversaciones de servicio al cliente basándote ÚNICAMENTE en los datos reales proporcionados. 
            NO inventes ni asumas información que no esté explícitamente en los datos. 
            Si los datos son limitados, indica claramente esta limitación.`
          },
          {
            role: 'user',
            content: `Analiza esta conversación basándote SOLO en los datos reales del archivo Excel:

**DATOS REALES DISPONIBLES:**
- Cliente: ${conversation.customerName}
- Teléfono: ${conversation.customerPhone}
- Estado en datos: ${conversation.status}
- Total mensajes registrados: ${conversation.totalMessages}
- Último mensaje registrado: "${conversation.lastMessage}"
- Agente asignado: ${conversation.assignedAgent || 'No especificado'}
- Fecha: ${conversation.startDate.toLocaleDateString()}

**CALIDAD DE DATOS:**
${dataQuality ? `- Completitud: ${Math.round(dataQuality.completenessScore * 100)}%
- Nombre real: ${dataQuality.hasRealName ? 'Sí' : 'No'}
- Teléfono real: ${dataQuality.hasRealPhone ? 'Sí' : 'No'}
- Mensajes reales: ${dataQuality.hasRealMessage ? 'Sí' : 'No'}` : 'No disponible'}

Genera un resumen de máximo 120 caracteres basándote ÚNICAMENTE en estos datos reales. No agregues información especulativa.`
          }
        ],
        temperature: 0.2, // Muy baja para ser más conservador
        max_tokens: 150
      })

      const summary = response.choices[0].message.content?.trim() || 'Resumen no disponible'
      
      // Validar que el resumen no contenga información inventada
      if (summary.includes('quiere comprar') || summary.includes('interesado en') || 
          summary.includes('negociación') || summary.includes('precio de')) {
        // Si el resumen parece especulativo, usar versión conservadora
        return `📋 ${conversation.customerName} - Estado: ${conversation.status}. ${conversation.totalMessages} mensajes. Último: "${conversation.lastMessage.substring(0, 40)}..."`
      }
      
      return summary
    } catch (error) {
      console.error('Error generando resumen:', error)
      return `📋 ${conversation.customerName} - Estado: ${conversation.status} (${conversation.totalMessages} mensajes registrados)`
    }
  }

  async generateConversationSuggestion(conversation: Conversation): Promise<string> {
    try {
      // Verificar calidad de datos
      const dataQuality = (conversation.metadata as any)?.dataQuality
      const hasIncompleteData = (conversation.metadata as any)?.incompleteData || false
      
      // Si los datos son incompletos, sugerir validación
      if (hasIncompleteData || (dataQuality && dataQuality.completenessScore < 0.3)) {
        return 'Validar y completar información del cliente antes de iniciar seguimiento comercial'
      }
      
      // Verificar si hay mensajes reales
      const hasNoMessages = conversation.totalMessages <= 1 && 
        (conversation.lastMessage === '[SIN MENSAJES EN DATOS ORIGINALES]' || 
         conversation.lastMessage === 'No se ha iniciado conversación')
      
      if (hasNoMessages) {
        return 'Enviar mensaje inicial personalizado para establecer primer contacto'
      }
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `Eres un consultor de ventas que sugiere acciones basándose ÚNICAMENTE en datos reales disponibles. 
            NO hagas suposiciones sobre intenciones de compra o intereses específicos que no estén claramente evidenciados en los datos.
            Enfócate en acciones prácticas basadas en el estado actual y los datos disponibles.`
          },
          {
            role: 'user',
            content: `Basándote ÚNICAMENTE en estos datos reales, sugiere la próxima acción:

**DATOS DEL ARCHIVO EXCEL:**
- Cliente: ${conversation.customerName}
- Estado documentado: ${conversation.status}
- Mensajes registrados: ${conversation.totalMessages}
- Último mensaje: "${conversation.lastMessage}"
- Fecha: ${conversation.startDate.toLocaleDateString()}
- Agente: ${conversation.assignedAgent || 'Sin asignar'}

**CALIDAD DE DATOS:**
${dataQuality ? `Completitud: ${Math.round(dataQuality.completenessScore * 100)}%` : 'No evaluada'}

Sugiere UNA acción específica de máximo 100 caracteres basada SOLO en estos datos, sin especular sobre intenciones no evidenciadas.`
          }
        ],
        temperature: 0.3,
        max_tokens: 150
      })

      const suggestion = response.choices[0].message.content?.trim() || 'Realizar seguimiento según protocolo estándar'
      
      // Validar que la sugerencia no sea especulativa
      if (suggestion.includes('está interesado') || suggestion.includes('quiere comprar') || 
          suggestion.includes('necesita') || suggestion.includes('busca')) {
        // Usar sugerencia conservadora basada en el estado
        switch (conversation.status) {
          case 'completed':
            return 'Solicitar feedback sobre el servicio recibido'
          case 'abandoned':
            return 'Contactar para verificar satisfacción y ofrecer asistencia'
          case 'pending':
            return 'Asignar agente y responder según protocolo establecido'
          case 'active':
            return 'Continuar seguimiento según historial de mensajes'
          default:
            return 'Revisar caso y definir siguiente acción según contexto'
        }
      }
      
      return suggestion
    } catch (error) {
      console.error('Error generando sugerencia:', error)
      
      // Sugerencias conservadoras basadas solo en el estado
      switch (conversation.status) {
        case 'completed':
          return 'Solicitar feedback y evaluar oportunidades adicionales'
        case 'abandoned':
          return 'Reactivar contacto con oferta de asistencia'
        case 'pending':
          return 'Asignar agente y proceder según protocolo'
        case 'active':
          return 'Continuar seguimiento activo y documentar progreso'
        default:
          return 'Evaluar caso y definir estrategia de seguimiento'
      }
    }
  }

  async generateInterest(conversation: Conversation): Promise<string> {
    try {
      // Verificar calidad de datos
      const dataQuality = (conversation.metadata as any)?.dataQuality
      const hasIncompleteData = (conversation.metadata as any)?.incompleteData || false
      
      // Si los datos son incompletos, no especular
      if (hasIncompleteData || (dataQuality && dataQuality.completenessScore < 0.3)) {
        return 'Datos insuficientes para determinar interés'
      }
      
      // Verificar si hay mensajes para analizar
      const hasNoMessages = conversation.totalMessages <= 1 && 
        (conversation.lastMessage === '[SIN MENSAJES EN DATOS ORIGINALES]' || 
         conversation.lastMessage === 'No se ha iniciado conversación')
      
      if (hasNoMessages) {
        return 'Sin mensajes para evaluar intención'
      }
      
      // Análisis básico de palabras clave en el mensaje real
      const message = conversation.lastMessage.toLowerCase()
      
      // Detectar intenciones evidentes solo si están claramente expresadas
      if (message.includes('precio') || message.includes('costo') || message.includes('cuánto cuesta')) {
        return 'Consulta de precios'
      } else if (message.includes('disponible') || message.includes('stock') || message.includes('tienen')) {
        return 'Verificación de disponibilidad'
      } else if (message.includes('comprar') || message.includes('adquirir') || message.includes('me interesa comprar')) {
        return 'Intención de compra expresada'
      } else if (message.includes('problema') || message.includes('no funciona') || message.includes('ayuda') || message.includes('soporte')) {
        return 'Solicitud de soporte'
      } else if (message.includes('información') || message.includes('detalles') || message.includes('más info')) {
        return 'Solicitud de información'
      } else {
        // Para casos ambiguos, usar IA con restricciones
        const response = await this.openai.chat.completions.create({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `Identifica el interés del cliente basándote ÚNICAMENTE en el mensaje exacto proporcionado. 
              Si el mensaje es ambiguo o no expresa claramente una intención, responde "No claramente identificado".
              NO hagas suposiciones más allá de lo explícitamente expresado.`
            },
            {
              role: 'user',
              content: `Mensaje exacto del cliente: "${conversation.lastMessage}"

Estado de la conversación: ${conversation.status}

Identifica el interés en máximo 25 caracteres. Si no está claro, responde "No claramente identificado".`
            }
          ],
          temperature: 0.1, // Muy conservador
          max_tokens: 30
        })

        const interest = response.choices[0].message.content?.trim() || 'No identificado'
        
        // Si la respuesta parece especulativa, usar análisis conservador
        if (interest.includes('posible') || interest.includes('probable') || 
            interest.includes('parece') || interest.includes('sugiere')) {
          return 'Requiere aclaración'
        }
        
        return interest
      }
    } catch (error) {
      console.error('Error generando interés:', error)
      return 'Error en análisis - revisar manualmente'
    }
  }

  async generateSalesPotential(conversation: Conversation): Promise<'low' | 'medium' | 'high'> {
    try {
      // Verificar calidad de datos
      const dataQuality = (conversation.metadata as any)?.dataQuality
      const hasIncompleteData = (conversation.metadata as any)?.incompleteData || false
      
      // Si los datos son incompletos, potencial bajo por defecto
      if (hasIncompleteData || (dataQuality && dataQuality.completenessScore < 0.5)) {
        return 'low'
      }
      
      // Lógica conservadora basada solo en datos evidentes
      if (conversation.status === 'completed') {
        return 'high' // Ya se completó algo
      }
      
      if (conversation.status === 'abandoned') {
        return 'low' // Fue abandonado
      }
      
      // Analizar mensaje para evidencia clara de intención
      const message = conversation.lastMessage.toLowerCase()
      
      if (message.includes('comprar') || message.includes('cuando puedo') || 
          message.includes('confirmo pedido') || message.includes('proceder con')) {
        return 'high'
      }
      
      if (message.includes('precio') || message.includes('disponible') || 
          message.includes('información') || message.includes('detalles')) {
        return 'medium'
      }
      
      // Considerar actividad (número de mensajes)
      if (conversation.totalMessages > 10) {
        return 'medium' // Alta actividad puede indicar interés
      }
      
      if (conversation.totalMessages > 5) {
        return 'medium'
      }
      
      return 'low' // Por defecto conservador
      
    } catch (error) {
      console.error('Error evaluando potencial de venta:', error)
      return 'low' // Conservador en caso de error
    }
  }
}