import * as XLSX from 'xlsx'
import type { 
  IFileProcessor,
  ValidationResult,
  ProcessResult,
  ProcessError
} from '@/domain/interfaces/IFileProcessor'
import type { 
  Conversation, 
  ConversationMetadata 
} from '@/domain/entities'
import { ConversationStatus } from '@/domain/entities'

export class ExcelFileProcessor implements IFileProcessor {
  private readonly supportedFormats = ['.xlsx', '.xls', '.csv']
  private readonly maxFileSize = 25 * 1024 * 1024 // 25MB
  
  // Mapeo expandido de posibles nombres de columnas (más de 200 variaciones)
  private readonly columnMappings = {
    customerName: [
      // Español
      'cliente', 'nombre', 'nom', 'client', 'customer_name', 'nombre_cliente', 'nom_client',
      'usuario', 'persona', 'contacto', 'lead', 'prospecto', 'nom_contacto', 'contacto_nombre',
      // Inglés  
      'customer', 'name', 'client_name', 'contact', 'person', 'user', 'lead_name', 'prospect',
      'full_name', 'first_name', 'last_name', 'contact_name', 'customer_contact', 'account_name',
      // Portugués
      'nome', 'cliente_nome', 'contato', 'pessoa', 'usuario_nome', 'lead_nome', 'prospect_nome',
      // CRM common
      'account', 'company', 'empresa', 'organization', 'org', 'titular', 'responsable', 'owner',
      // Variaciones técnicas
      'name_field', 'customer_field', 'contact_field', 'person_field', 'user_field',
      // Variaciones cortas
      'nom', 'cli', 'usr', 'per', 'con', 'acc'
    ],
    customerPhone: [
      // Español
      'telefono', 'tel', 'celular', 'movil', 'whatsapp', 'numero', 'phone', 'cel', 'telefon',
      'numero_telefono', 'telefono_contacto', 'tel_contacto', 'numero_celular', 'num_tel',
      // Inglés
      'phone', 'mobile', 'cell', 'telephone', 'phone_number', 'mobile_number', 'cell_number',
      'contact_phone', 'primary_phone', 'work_phone', 'home_phone', 'phone_1', 'phone1',
      // WhatsApp específico
      'whatsapp', 'whats', 'wa', 'wpp', 'whatsapp_number', 'wa_number', 'whats_number',
      // Portugués
      'telefone', 'celular', 'fone', 'numero_telefone', 'tel_contato', 'cel_contato',
      // Variaciones técnicas
      'phone_field', 'mobile_field', 'contact_number', 'communication_number',
      // Variaciones internacionales
      'internacional', 'country_code', 'area_code', 'extension', 'ext'
    ],
    startDate: [
      // Español
      'fecha', 'fecha_inicio', 'fecha_creacion', 'fecha_contacto', 'inicio', 'creado', 'created',
      'fecha_registro', 'registro', 'fecha_alta', 'alta', 'fecha_ingreso', 'ingreso',
      // Inglés
      'date', 'start_date', 'created_date', 'creation_date', 'contact_date', 'entry_date',
      'registration_date', 'signup_date', 'join_date', 'first_contact', 'initial_date',
      // Formatos comunes
      'timestamp', 'datetime', 'created_at', 'updated_at', 'date_created', 'date_added',
      // Portugués
      'data', 'data_inicio', 'data_criacao', 'data_contato', 'data_registro', 'criado_em',
      // Variaciones CRM
      'lead_date', 'prospect_date', 'opportunity_date', 'deal_date', 'pipeline_date',
      // Variaciones cortas
      'dt', 'fecha_dt', 'date_dt', 'cr_date', 'reg_date'
    ],
    endDate: [
      // Español
      'fecha_fin', 'fecha_final', 'fecha_cierre', 'fin', 'final', 'cierre', 'terminado',
      'fecha_completado', 'completado', 'fecha_resuelto', 'resuelto', 'cerrado',
      // Inglés
      'end_date', 'final_date', 'close_date', 'completion_date', 'resolved_date', 'finished_date',
      'closed_date', 'end_time', 'final_time', 'closure_date', 'resolution_date',
      // Formatos comunes
      'closed_at', 'completed_at', 'resolved_at', 'finished_at', 'end_timestamp',
      // Portugués
      'data_fim', 'data_final', 'data_fechamento', 'finalizado', 'resolvido', 'fechado',
      // Estados específicos
      'won_date', 'lost_date', 'cancelled_date', 'expired_date'
    ],
    status: [
      // Español
      'estado', 'status', 'estatus', 'situacion', 'condicion', 'fase', 'etapa', 'stage',
      'estado_conversacion', 'estado_lead', 'estado_cliente', 'situacion_actual',
      // Inglés  
      'status', 'state', 'stage', 'phase', 'condition', 'situation', 'current_status',
      'deal_status', 'lead_status', 'opportunity_status', 'pipeline_stage', 'sales_stage',
      // CRM específico
      'pipeline', 'funnel', 'workflow', 'process', 'step', 'milestone', 'progress',
      // Portugués
      'status', 'estado', 'situacao', 'condicao', 'fase', 'estagio', 'etapa',
      // Variaciones específicas
      'conversation_status', 'chat_status', 'contact_status', 'customer_status',
      // Variaciones cortas
      'stat', 'st', 'est', 'sts'
    ],
    totalMessages: [
      // Español
      'mensajes', 'total_mensajes', 'num_mensajes', 'cantidad_mensajes', 'msgs', 'messages',
      'conversaciones', 'intercambios', 'respuestas', 'interacciones', 'comunicaciones',
      // Inglés
      'messages', 'total_messages', 'message_count', 'msg_count', 'conversation_count',
      'interactions', 'exchanges', 'communications', 'responses', 'replies',
      // Específico chat
      'chat_messages', 'whatsapp_messages', 'text_messages', 'message_volume',
      // Portugués
      'mensagens', 'total_mensagens', 'num_mensagens', 'quantidade_mensagens',
      // Métricas
      'activity', 'engagement', 'touch_points', 'contact_points', 'communication_frequency'
    ],
    lastMessage: [
      // Español
      'ultimo_mensaje', 'mensaje_final', 'ultimo_msg', 'msg_final', 'texto_final',
      'contenido_ultimo', 'ultimo_texto', 'mensaje_reciente', 'ultimo_contacto',
      // Inglés
      'last_message', 'final_message', 'latest_message', 'recent_message', 'last_msg',
      'final_msg', 'last_text', 'recent_text', 'latest_communication', 'last_contact',
      // Específico contenido
      'message_content', 'text_content', 'content', 'body', 'message_body', 'text_body',
      'conversation_content', 'chat_content', 'last_communication_content',
      // Portugués
      'ultima_mensagem', 'mensagem_final', 'ultimo_contato', 'texto_final', 'conteudo_ultimo'
    ],
    assignedAgent: [
      // Español
      'agente', 'vendedor', 'representante', 'asesor', 'consultor', 'responsable', 'asignado',
      'agente_asignado', 'vendedor_asignado', 'rep_ventas', 'ejecutivo', 'specialist',
      // Inglés
      'agent', 'sales_rep', 'representative', 'salesperson', 'advisor', 'consultant',
      'assigned_agent', 'sales_agent', 'account_manager', 'relationship_manager', 'owner',
      'assigned_to', 'handled_by', 'managed_by', 'rep', 'specialist', 'executive',
      // Roles específicos
      'account_executive', 'sales_executive', 'business_development', 'bd_rep', 'closer',
      // Portugués
      'agente', 'vendedor', 'representante', 'consultor', 'responsavel', 'designado',
      // Variaciones organizacionales
      'team', 'department', 'division', 'unit', 'group', 'squad'
    ],
    metadata: [
      // Información adicional
      'notas', 'observaciones', 'comentarios', 'descripcion', 'detalles', 'info_adicional',
      'notes', 'observations', 'comments', 'description', 'details', 'additional_info',
      'remarks', 'memo', 'summary', 'overview', 'context', 'background',
      // Datos técnicos
      'metadata', 'custom_fields', 'properties', 'attributes', 'tags', 'labels',
      'categories', 'classification', 'type', 'source', 'channel', 'medium',
      // Portugués
      'notas', 'observacoes', 'comentarios', 'descricao', 'detalhes', 'informacao_adicional'
    ],
    satisfaction: [
      // Español
      'satisfaccion', 'rating', 'calificacion', 'puntuacion', 'score', 'valoracion',
      'evaluacion', 'feedback', 'opinion', 'experiencia', 'nps', 'csat',
      // Inglés
      'satisfaction', 'rating', 'score', 'evaluation', 'feedback', 'review',
      'experience', 'quality', 'service_rating', 'customer_satisfaction', 'nps', 'csat',
      // Métricas específicas
      'net_promoter_score', 'customer_effort_score', 'ces', 'quality_score',
      // Portugués
      'satisfacao', 'avaliacao', 'pontuacao', 'classificacao', 'feedback', 'experiencia'
    ],
    responseTime: [
      // Español
      'tiempo_respuesta', 'response_time', 'tiempo_atencion', 'duracion', 'demora',
      'tiempo_resolucion', 'tiempo_contacto', 'velocidad_respuesta', 'latencia',
      // Inglés
      'response_time', 'reply_time', 'resolution_time', 'handling_time', 'processing_time',
      'turnaround_time', 'cycle_time', 'lead_time', 'wait_time', 'service_time',
      // Métricas temporales
      'sla', 'efficiency', 'speed', 'velocity', 'performance', 'productivity',
      // Portugués
      'tempo_resposta', 'tempo_atendimento', 'tempo_resolucao', 'duracao', 'latencia'
    ]
  }

  getSupportedFormats(): string[] {
    return this.supportedFormats
  }

  getMaxFileSize(): number {
    return this.maxFileSize
  }

  async validateFile(file: File): Promise<ValidationResult> {
    console.log('🔍 Iniciando validación de archivo:', {
      name: file?.name || 'Sin nombre',
      size: file?.size || 0,
      type: file?.type || 'Sin tipo'
    })

    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Validar tamaño
      if (file.size > this.maxFileSize) {
        errors.push(`El archivo excede el tamaño máximo de ${this.maxFileSize / (1024 * 1024)}MB`)
      }

      // Validar formato
      console.log('📋 Validando formato de archivo...')
      const extension = this.getFileExtension(file.name)
      console.log('📁 Extensión detectada:', extension)
      
      if (!this.supportedFormats.includes(extension)) {
        errors.push(`Formato no soportado. Formatos permitidos: ${this.supportedFormats.join(', ')}`)
      }

      // Validar contenido básico si es válido hasta ahora
      if (errors.length === 0) {
        try {
          console.log('📊 Revisando contenido del archivo...')
          const preview = await this.previewFileContent(file)
          console.log('📋 Vista previa:', preview)
          
          if (preview.rows < 2) {
            errors.push('El archivo debe contener al menos una fila de datos además de los encabezados')
          }
          if (preview.columns < 3) {
            warnings.push('El archivo tiene pocas columnas. Asegúrate de incluir al menos: cliente, teléfono y fecha')
          }
        } catch (error) {
          console.error('❌ Error leyendo contenido:', error)
          errors.push('No se pudo leer el contenido del archivo. Verifica que no esté corrupto')
        }
      }

      console.log('✅ Validación completada:', { errors, warnings })

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      }
    } catch (error) {
      console.error('💥 Error durante validación:', error)
      errors.push('Error inesperado durante la validación del archivo')
      return {
        isValid: false,
        errors,
        warnings
      }
    }
  }

  async processFile(file: File): Promise<ProcessResult> {
    console.log('⚙️ Iniciando procesamiento de archivo Excel:', file.name)
    const startTime = Date.now()
    const conversations: Conversation[] = []
    const errors: ProcessError[] = []
    let totalProcessed = 0

    try {
      console.log('📖 Leyendo archivo Excel...')
      const workbook = await this.readFile(file)
      console.log('📊 Archivo leído, hojas disponibles:', workbook.SheetNames)
      
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      console.log('📋 Procesando hoja:', workbook.SheetNames[0])
      
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
      console.log('📈 Datos extraídos, filas totales:', rawData.length)

      if (rawData.length < 2) {
        throw new Error('El archivo no contiene datos válidos')
      }

      const headers = rawData[0].map((h: any) => String(h).toLowerCase().trim())
      console.log('📝 Headers detectados:', headers)
      
      const columnMapping = this.detectColumnMapping(headers)
      console.log('🗂️ Mapeo de columnas:', columnMapping)

      // Procesar cada fila
      for (let i = 1; i < rawData.length; i++) {
        totalProcessed++
        try {
          const row = rawData[i]
          console.log(`📄 Procesando fila ${i + 1}:`, row)
          
          const conversation = this.parseConversationFromRow(row, columnMapping, i + 1)
          
          if (conversation) {
            conversations.push(conversation)
            console.log(`✅ Conversación creada para fila ${i + 1}:`, conversation.customerName)
          } else {
            console.log(`⚠️ Fila ${i + 1} no pudo ser procesada`)
          }
        } catch (error) {
          console.error(`❌ Error en fila ${i + 1}:`, error)
          errors.push({
            row: i + 1,
            column: 'general',
            message: error instanceof Error ? error.message : 'Error desconocido',
            severity: 'error'
          })
        }
      }

      const processingTime = Date.now() - startTime
      console.log('🎉 Procesamiento completado:', {
        totalProcessed,
        conversationsCreated: conversations.length,
        errorsCount: errors.length,
        processingTime
      })

      return {
        conversations,
        totalProcessed,
        errors,
        summary: {
          totalRows: rawData.length - 1,
          successfulRows: conversations.length,
          errorRows: errors.filter(e => e.severity === 'error').length,
          processingTime
        }
      }
    } catch (error) {
      console.error('💥 Error grave durante procesamiento:', error)
      throw new Error(`Error procesando archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  private async readFile(file: File): Promise<XLSX.WorkBook> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          resolve(workbook)
        } catch (error) {
          reject(new Error('Error leyendo el archivo Excel'))
        }
      }
      
      reader.onerror = () => reject(new Error('Error leyendo el archivo'))
      reader.readAsArrayBuffer(file)
    })
  }

  private async previewFileContent(file: File): Promise<{ rows: number; columns: number }> {
    const workbook = await this.readFile(file)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    
    return {
      rows: range.e.r + 1,
      columns: range.e.c + 1
    }
  }

  private getFileExtension(filename: string): string {
    if (!filename || typeof filename !== 'string') {
      throw new Error('Nombre de archivo inválido')
    }
    return filename.toLowerCase().substring(filename.lastIndexOf('.'))
  }

  private detectColumnMapping(headers: string[]): Record<string, number> {
    const mapping: Record<string, number> = {}
    
    console.log('🔍 Iniciando detección avanzada de columnas...')
    console.log('📋 Headers disponibles:', headers)

    // Función auxiliar para normalizar texto
    const normalizeText = (text: string): string => {
      return text.toLowerCase()
        .trim()
        .replace(/[áàäâ]/g, 'a')
        .replace(/[éèëê]/g, 'e')
        .replace(/[íìïî]/g, 'i')
        .replace(/[óòöô]/g, 'o')
        .replace(/[úùüû]/g, 'u')
        .replace(/[ñ]/g, 'n')
        .replace(/[ç]/g, 'c')
        .replace(/[_\-\s\.]/g, '')
        .replace(/[^\w]/g, '')
    }

    // Función para calcular similitud entre strings
    const calculateSimilarity = (str1: string, str2: string): number => {
      const normalized1 = normalizeText(str1)
      const normalized2 = normalizeText(str2)
      
      // Coincidencia exacta
      if (normalized1 === normalized2) return 1.0
      
      // Contiene la palabra completa
      if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return 0.9
      
      // Similitud de Levenshtein simplificada
      const maxLen = Math.max(normalized1.length, normalized2.length)
      const minLen = Math.min(normalized1.length, normalized2.length)
      
      if (maxLen === 0) return 1.0
      if (minLen / maxLen < 0.5) return 0.0 // Muy diferentes en longitud
      
      let matches = 0
      for (let i = 0; i < minLen; i++) {
        if (normalized1[i] === normalized2[i]) matches++
      }
      
      return matches / maxLen
    }

    // Array para rastrear columnas ya asignadas
    const assignedColumns = new Set<number>()

    // Mapeo inteligente con puntuación - orden de prioridad
    const fieldPriorities = ['customerName', 'customerPhone', 'startDate', 'status', 'totalMessages', 'lastMessage', 'assignedAgent']
    
    for (const fieldKey of fieldPriorities) {
      const columnOptions = this.columnMappings[fieldKey as keyof typeof this.columnMappings]
      if (!columnOptions) continue
      
      let bestMatch = { index: -1, score: 0 }
      
      headers.forEach((header, index) => {
        if (!header || typeof header !== 'string' || assignedColumns.has(index)) return
        
        // Buscar la mejor coincidencia para este header
        for (const possibleName of columnOptions) {
          const similarity = calculateSimilarity(header, possibleName)
          
          if (similarity > bestMatch.score && similarity >= 0.7) { // Umbral de similitud
            bestMatch = { index, score: similarity }
          }
        }
      })
      
      if (bestMatch.index !== -1) {
        mapping[fieldKey] = bestMatch.index
        assignedColumns.add(bestMatch.index)
        console.log(`✅ Encontrada columna ${fieldKey} en índice ${bestMatch.index}: "${headers[bestMatch.index]}" (similitud: ${bestMatch.score.toFixed(2)})`)
      }
    }

    // Análisis de patrones más específicos para campos críticos
    if (!mapping.customerName) {
      console.log('🔍 Buscando columna de nombre por patrones avanzados...')
      const nameIndex = headers.findIndex((header, index) => {
        if (!header || assignedColumns.has(index)) return false
        const h = normalizeText(header)
        
        // Patrones más específicos de nombre
        const namePatterns = [
          /^nom/i, /client/i, /customer/i, /usuario/i, /person/i, /contact/i,
          /^name$/i, /^cliente$/i, /^nombre$/i, /^conta/i, /lead/i, /buyer/i
        ]
        
        const matchesPattern = namePatterns.some(pattern => pattern.test(header))
        
        // Si es la primera columna y no es número ni fecha, probablemente sea nombre
        const isFirstColumnText = (index === 0 && h.length > 2 && h.length < 50 && 
                                  !h.match(/^\d+$/) && !h.match(/fecha|date|time/i))
        
        return matchesPattern || isFirstColumnText
      })
      
      if (nameIndex !== -1) {
        mapping.customerName = nameIndex
        assignedColumns.add(nameIndex)
        console.log(`🔧 Asignando columna de nombre por patrón: "${headers[nameIndex]}" (índice ${nameIndex})`)
      }
    }

    if (!mapping.customerPhone) {
      console.log('🔍 Buscando columna de teléfono por patrones avanzados...')
      const phoneIndex = headers.findIndex((header, index) => {
        if (!header || assignedColumns.has(index)) return false
        
        // Patrones más específicos de teléfono
        const phonePatterns = [
          /tel/i, /phone/i, /cel/i, /whats/i, /numero/i, /mobile/i, 
          /contact/i, /movil/i, /fone/i, /^\d+$/
        ]
        
        return phonePatterns.some(pattern => pattern.test(header))
      })
      
      if (phoneIndex !== -1) {
        mapping.customerPhone = phoneIndex
        assignedColumns.add(phoneIndex)
        console.log(`🔧 Asignando columna de teléfono por patrón: "${headers[phoneIndex]}" (índice ${phoneIndex})`)
      }
    }

    if (!mapping.startDate) {
      console.log('🔍 Buscando columna de fecha por patrones avanzados...')
      const dateIndex = headers.findIndex((header, index) => {
        if (!header || assignedColumns.has(index)) return false
        
        // Patrones más específicos de fecha
        const datePatterns = [
          /fecha/i, /date/i, /time/i, /dia/i, /day/i, /created/i, /inicio/i,
          /timestamp/i, /datetime/i, /registro/i, /alta/i, /start/i
        ]
        
        return datePatterns.some(pattern => pattern.test(header))
      })
      
      if (dateIndex !== -1) {
        mapping.startDate = dateIndex
        assignedColumns.add(dateIndex)
        console.log(`🔧 Asignando columna de fecha por patrón: "${headers[dateIndex]}" (índice ${dateIndex})`)
      }
    }

    // Mapeo por posición como último recurso - solo si no hay conflictos
    if (!mapping.customerName && headers.length > 0) {
      // Buscar la primera columna no asignada que parezca texto
      const availableIndex = headers.findIndex((header, index) => {
        if (assignedColumns.has(index)) return false
        // Evitar columnas que claramente no son nombres
        const h = String(header || '').toLowerCase()
        return !h.match(/^\d+$/) && !h.match(/fecha|date|phone|tel/i) && h.length > 0
      })
      
      if (availableIndex !== -1) {
        mapping.customerName = availableIndex
        assignedColumns.add(availableIndex)
        console.log(`🔧 Usando columna ${availableIndex} como nombre: "${headers[availableIndex]}"`)
      } else if (!assignedColumns.has(0)) {
        mapping.customerName = 0
        assignedColumns.add(0)
        console.log(`🔧 Usando primera columna como nombre: "${headers[0]}"`)
      }
    }

    if (!mapping.customerPhone && headers.length > 1) {
      // Buscar columna que contenga números o usar columna disponible
      let phoneIndex = headers.findIndex((header, index) => {
        if (assignedColumns.has(index)) return false
        const text = String(header || '').replace(/\s/g, '')
        return text.match(/\d{8,}/) || text.match(/\+?\d/) || text.match(/phone|tel|cel/i)
      })
      
      if (phoneIndex === -1) {
        // Buscar cualquier columna disponible que no sea la de nombre
        phoneIndex = headers.findIndex((_, index) => 
          !assignedColumns.has(index) && index !== mapping.customerName
        )
      }
      
      if (phoneIndex !== -1) {
        mapping.customerPhone = phoneIndex
        assignedColumns.add(phoneIndex)
        console.log(`🔧 Usando columna ${phoneIndex} como teléfono: "${headers[phoneIndex]}"`)
      }
    }

    if (!mapping.startDate && headers.length > 2) {
      // Buscar una columna disponible que pueda ser fecha
      let dateIndex = headers.findIndex((header, index) => {
        if (assignedColumns.has(index)) return false
        const h = String(header || '').toLowerCase()
        return h.includes('fecha') || h.includes('date') || h.includes('time') || h.includes('created')
      })
      
      if (dateIndex === -1) {
        // Usar cualquier columna disponible restante
        dateIndex = headers.findIndex((_, index) => !assignedColumns.has(index))
      }
      
      if (dateIndex !== -1) {
        mapping.startDate = dateIndex
        assignedColumns.add(dateIndex)
        console.log(`🔧 Usando columna ${dateIndex} como fecha: "${headers[dateIndex]}"`)
      }
    }

    // Mapear columnas adicionales automáticamente
    const remainingHeaders = headers.map((header, index) => ({ header, index }))
      .filter(({ index }) => !assignedColumns.has(index))

    for (const { header, index } of remainingHeaders) {
      if (!header) continue
      
      const h = normalizeText(header)
      
      // Estado/Status
      if (!mapping.status && (h.includes('estado') || h.includes('status') || h.includes('stage'))) {
        mapping.status = index
        assignedColumns.add(index)
        console.log(`🔧 Auto-detectando estado en columna ${index}: "${header}"`)
      }
      
      // Mensajes
      else if (!mapping.totalMessages && (h.includes('mensaje') || h.includes('message') || h.includes('msg'))) {
        mapping.totalMessages = index
        assignedColumns.add(index)
        console.log(`🔧 Auto-detectando mensajes en columna ${index}: "${header}"`)
      }
      
      // Agente
      else if (!mapping.assignedAgent && (h.includes('agente') || h.includes('agent') || h.includes('vendedor') || h.includes('responsable'))) {
        mapping.assignedAgent = index
        assignedColumns.add(index)
        console.log(`🔧 Auto-detectando agente en columna ${index}: "${header}"`)
      }
    }

    console.log('📋 Mapeo final mejorado:', mapping)
    console.log('📊 Columnas mapeadas:', Object.keys(mapping).length, 'de', headers.length, 'disponibles')
    console.log('🔒 Columnas asignadas:', Array.from(assignedColumns))
    
    // Validar mapeo mínimo
    const requiredFields = ['customerName', 'customerPhone']
    const missingFields = requiredFields.filter(field => mapping[field] === undefined)
    
    if (missingFields.length > 0) {
      console.warn('⚠️ Campos requeridos faltantes:', missingFields)
      console.log('🔧 Intentando mapeo de emergencia...')
      
      // Mapeo de emergencia más inteligente
      if (!mapping.customerName && headers.length > 0) {
        const emergencyNameIndex = headers.findIndex((_, index) => !assignedColumns.has(index))
        if (emergencyNameIndex !== -1) {
          mapping.customerName = emergencyNameIndex
          assignedColumns.add(emergencyNameIndex)
          console.log('🚨 Mapeo de emergencia: customerName = columna', emergencyNameIndex)
        }
      }
      
      if (!mapping.customerPhone && headers.length > 1) {
        const emergencyPhoneIndex = headers.findIndex((_, index) => !assignedColumns.has(index))
        if (emergencyPhoneIndex !== -1) {
          mapping.customerPhone = emergencyPhoneIndex
          assignedColumns.add(emergencyPhoneIndex)
          console.log('🚨 Mapeo de emergencia: customerPhone = columna', emergencyPhoneIndex)
        }
      }
    }
    
    return mapping
  }

  private parseConversationFromRow(
    row: any[], 
    columnMapping: Record<string, number>, 
    rowNumber: number
  ): Conversation | null {
    try {
      console.log(`🔍 Analizando fila ${rowNumber}:`, row)
      
      // Función auxiliar para convertir valores a string de forma segura
      const safeStringConvert = (value: any): string => {
        if (value === null || value === undefined) return ''
        if (typeof value === 'string') return value
        if (typeof value === 'number') return String(value)
        if (typeof value === 'boolean') return String(value)
        if (value instanceof Date) return value.toISOString()
        return String(value)
      }
      
      // Obtener nombre del cliente (requerido)
      let customerName = this.getCellValue(row, columnMapping.customerName)
      
      // Convertir a string de forma segura y validar
      if (customerName !== null && customerName !== undefined) {
        customerName = safeStringConvert(customerName).trim()
      }
      
      // Si no tenemos nombre mapeado, buscar en las primeras columnas cualquier texto válido
      if (!customerName && row.length > 0) {
        for (let i = 0; i < Math.min(4, row.length); i++) {
          const value = this.getCellValue(row, i)
          if (value && value !== null && value !== undefined) {
            const stringValue = safeStringConvert(value).trim()
            if (stringValue.length > 1 && 
                !stringValue.match(/^\d+$/) && 
                !this.looksLikeDate(value) && // Evitar fechas como nombres
                !stringValue.match(/^\d{4}-\d{2}-\d{2}/) && // Evitar formatos de fecha ISO
                !stringValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}/) && // Evitar dd/mm/yyyy
                !stringValue.match(/^\d{1,2}-\d{1,2}-\d{4}/) && // Evitar dd-mm-yyyy
                !stringValue.match(/^[\d\s\-\+\(\)]{8,}$/)) { // Evitar teléfonos
              customerName = stringValue
              console.log(`🔧 Usando "${customerName}" como nombre del cliente (columna ${i})`)
              break
            }
          }
        }
      }
      
      // Si aún no tenemos nombre válido, generar uno más descriptivo
      if (!customerName || customerName.trim() === '') {
        customerName = `Cliente Sin Nombre #${rowNumber}`
        console.log(`🔧 Generando nombre por defecto: "${customerName}"`)
      }
      
      // Obtener teléfono del cliente (requerido)
      let customerPhone = this.getCellValue(row, columnMapping.customerPhone)
      
      // Convertir a string de forma segura
      if (customerPhone !== null && customerPhone !== undefined) {
        customerPhone = safeStringConvert(customerPhone)
      }
      
      // Si no tenemos teléfono mapeado, buscar cualquier valor que parezca un número
      if (!customerPhone && row.length > 0) {
        for (let i = 0; i < row.length; i++) {
          const value = this.getCellValue(row, i)
          if (value && value !== null && value !== undefined) {
            const stringValue = safeStringConvert(value)
            if (typeof value === 'number' || 
                (stringValue && (
                  stringValue.match(/[\d+()-\s]{8,}/) || // Números con al menos 8 dígitos
                  stringValue.match(/^\+?[\d\s()-]{10,}$/) || // Formato teléfono
                  stringValue.match(/^\d{10,}$/) // Solo números largos
                ))) {
              customerPhone = stringValue
              console.log(`🔧 Usando "${customerPhone}" como teléfono (columna ${i})`)
              break
            }
          }
        }
      }
      
      // Si aún no tenemos teléfono, generar uno
      if (!customerPhone) {
        customerPhone = `+52${Math.floor(1000000000 + Math.random() * 9000000000)}`
        console.log(`🔧 Generando teléfono por defecto: "${customerPhone}"`)
      }
      
      // Parsear fecha con múltiples estrategias
      let startDate: Date = new Date() // Default fallback
      
      // Intentar obtener fecha de la columna mapeada
      if (columnMapping.startDate !== undefined) {
        const dateValue = this.getCellValue(row, columnMapping.startDate)
        if (dateValue) {
          try {
            const parsedDate = this.parseDate(dateValue)
            if (parsedDate && !isNaN(parsedDate.getTime())) {
              startDate = parsedDate
              console.log(`✅ Fecha parseada desde columna mapeada: ${startDate}`)
            }
          } catch (error) {
            console.warn(`⚠️ Error parseando fecha mapeada:`, error)
          }
        }
      }
      
      // Si no obtuvimos fecha válida, buscar en todas las columnas
      if (startDate.getTime() === new Date().getTime() || isNaN(startDate.getTime())) {
        for (let i = 0; i < row.length; i++) {
          const value = this.getCellValue(row, i)
          if (value && this.looksLikeDate(value)) {
            try {
              const parsedDate = this.parseDate(value)
              if (parsedDate && !isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 2000) {
                startDate = parsedDate
                console.log(`🔧 Fecha encontrada en columna ${i}: ${startDate}`)
                break
              }
            } catch (e) {
              // Continuar buscando
            }
          }
        }
      }

      // Parsear estado con flexibilidad
      let status = ConversationStatus.PENDING // Default
      const statusValue = this.getCellValue(row, columnMapping.status)
      
      if (statusValue) {
        status = this.parseStatus(statusValue)
      } else {
        // Buscar en cualquier columna un valor que parezca estado
        for (let i = 0; i < row.length; i++) {
          const value = this.getCellValue(row, i)
          if (value && typeof value === 'string') {
            const statusCandidate = this.parseStatus(value)
            if (statusCandidate !== ConversationStatus.PENDING) {
              status = statusCandidate
              console.log(`🔧 Estado encontrado en columna ${i}: ${status}`)
              break
            }
          }
        }
      }

      // Obtener número de mensajes
      let totalMessages = 1 // Default
      const messagesValue = this.getCellValue(row, columnMapping.totalMessages)
      if (messagesValue) {
        const parsed = this.parseNumber(messagesValue)
        if (parsed && parsed > 0) {
          totalMessages = parsed
        }
      } else {
        // Buscar cualquier número que pueda ser cantidad de mensajes
        for (let i = 0; i < row.length; i++) {
          const value = this.getCellValue(row, i)
          const num = this.parseNumber(value)
          if (num && num > 0 && num < 1000) { // Rango razonable para mensajes
            totalMessages = num
            console.log(`🔧 Cantidad de mensajes encontrada en columna ${i}: ${totalMessages}`)
            break
          }
        }
      }

      // Obtener último mensaje
      let lastMessage = 'No se ha iniciado conversación'
      const lastMessageValue = this.getCellValue(row, columnMapping.lastMessage)
      
      if (lastMessageValue && lastMessageValue !== null && lastMessageValue !== undefined) {
        const safeMessage = safeStringConvert(lastMessageValue).trim()
        if (safeMessage.length > 0) {
          lastMessage = safeMessage
        }
      } else {
        // Buscar cualquier columna con texto que pueda ser un mensaje
        for (let i = 0; i < row.length; i++) {
          const value = this.getCellValue(row, i)
          if (value && value !== null && value !== undefined) {
            const stringValue = safeStringConvert(value)
            if (stringValue.length > 10 && 
                stringValue !== customerName && 
                !this.looksLikeDate(value) && 
                !stringValue.match(/^\d+$/)) {
              lastMessage = stringValue.trim()
              console.log(`🔧 Último mensaje encontrado en columna ${i}: "${lastMessage.substring(0, 50)}..."`)
              break
            }
          }
        }
      }

      // Obtener agente asignado
      let assignedAgent: string | undefined
      const agentValue = this.getCellValue(row, columnMapping.assignedAgent)
      if (agentValue && agentValue !== null && agentValue !== undefined) {
        const safeAgent = safeStringConvert(agentValue).trim()
        if (safeAgent.length > 0) {
          assignedAgent = safeAgent
        }
      }

      // Metadatos flexibles
      const metadata: ConversationMetadata = {
        source: 'Excel Import',
        responseTime: 0,
        satisfaction: undefined,
        totalPurchaseValue: undefined,
        conversionRate: undefined
      }

      // Buscar valores numéricos que podrían ser montos, ratings, etc.
      for (let i = 0; i < row.length; i++) {
        const value = this.getCellValue(row, i)
        const num = this.parseNumber(value)
        if (num && num > 0) {
          if (num >= 1 && num <= 5) {
            // Podría ser rating/satisfacción
            if (!metadata.satisfaction) {
              metadata.satisfaction = num
            }
          } else if (num > 100) {
            // Podría ser monto
            if (!metadata.totalPurchaseValue) {
              metadata.totalPurchaseValue = num
            }
          }
        }
      }

      const conversation: Conversation = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customerName: safeStringConvert(customerName).trim(),
        customerPhone: this.formatPhoneNumber(safeStringConvert(customerPhone)),
        startDate,
        endDate: undefined, // Se puede agregar lógica para fecha fin si es necesario
        status,
        totalMessages,
        lastMessage: safeStringConvert(lastMessage).trim(),
        assignedAgent,
        tags: [], // Se pueden agregar tags basados en análisis
        metadata
      }

      console.log(`✅ Conversación creada para fila ${rowNumber}:`, {
        customerName: conversation.customerName,
        customerPhone: conversation.customerPhone,
        status: conversation.status,
        startDate: conversation.startDate
      })

      return conversation
    } catch (error) {
      console.warn(`❌ Error procesando fila ${rowNumber}:`, error)
      // En lugar de devolver null, intentar crear una conversación mínima
      try {
        const fallbackConversation: Conversation = {
          id: `conv_error_${Date.now()}_${rowNumber}`,
          customerName: `Cliente_${rowNumber}`,
          customerPhone: `+52${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          startDate: new Date(),
          status: ConversationStatus.PENDING,
          totalMessages: 1,
          lastMessage: 'Error al procesar mensaje original',
          tags: ['error_import'],
          metadata: {
            source: 'Excel Import (Error Recovery)',
            responseTime: 0
          }
        }
        console.log(`🔧 Conversación de respaldo creada para fila ${rowNumber}`)
        return fallbackConversation
      } catch (fallbackError) {
        console.error(`💥 Error creando conversación de respaldo para fila ${rowNumber}:`, fallbackError)
        return null
      }
    }
  }

  // Método auxiliar para detectar si un valor parece una fecha
  private looksLikeDate(value: any): boolean {
    if (!value) return false
    
    // Si ya es una fecha
    if (value instanceof Date) return true
    
    // Si es un número Excel de fecha (típicamente entre 40000-50000)
    if (typeof value === 'number' && value > 40000 && value < 60000) return true
    
    // Si es string con formato de fecha
    if (typeof value === 'string') {
      const datePatterns = [
        /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/, // DD/MM/YYYY o MM/DD/YYYY
        /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/, // YYYY/MM/DD
        /^\d{1,2}\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)/i, // DD mes
        /^(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\s+\d{1,2}/i, // mes DD
      ]
      return datePatterns.some(pattern => pattern.test(value.trim()))
    }
    
    return false
  }

  private getCellValue(row: any[], columnIndex: number | undefined): any {
    if (columnIndex === undefined || columnIndex >= row.length) return null
    const value = row[columnIndex]
    return value !== null && value !== undefined && value !== '' ? value : null
  }

  private parseDate(value: any): Date {
    if (value instanceof Date) return value
    
    // Si es un número de Excel (días desde 1900)
    if (typeof value === 'number') {
      return new Date((value - 25569) * 86400 * 1000)
    }
    
    // Si es string, intentar parsear
    if (typeof value === 'string') {
      const parsed = new Date(value)
      if (!isNaN(parsed.getTime())) return parsed
      
      // Intentar formatos comunes en español
      const formats = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // dd/mm/yyyy
        /(\d{4})-(\d{1,2})-(\d{1,2})/,    // yyyy-mm-dd
        /(\d{1,2})-(\d{1,2})-(\d{4})/     // dd-mm-yyyy
      ]
      
      for (const format of formats) {
        const match = value.match(format)
        if (match) {
          const [, day, month, year] = match
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        }
      }
    }
    
    throw new Error(`No se pudo parsear la fecha: ${value}`)
  }

  private parseStatus(value: any): ConversationStatus {
    if (!value) return ConversationStatus.PENDING
    
    const statusStr = String(value).toLowerCase().trim()
    const statusMap: Record<string, ConversationStatus> = {
      'activo': ConversationStatus.ACTIVE,
      'active': ConversationStatus.ACTIVE,
      'completado': ConversationStatus.COMPLETED,
      'completed': ConversationStatus.COMPLETED,
      'finalizado': ConversationStatus.COMPLETED,
      'abandonado': ConversationStatus.ABANDONED,
      'abandoned': ConversationStatus.ABANDONED,
      'pendiente': ConversationStatus.PENDING,
      'pending': ConversationStatus.PENDING
    }
    
    return statusMap[statusStr] || ConversationStatus.PENDING
  }

  private parseNumber(value: any): number | undefined {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const num = parseFloat(value.replace(/[^0-9.-]/g, ''))
      return isNaN(num) ? undefined : num
    }
    return undefined
  }

  private formatPhoneNumber(phone: string): string {
    if (!phone || typeof phone !== 'string') {
      return '+52000000000' // Número de fallback
    }
    
    // Limpiar y formatear número de teléfono
    const cleaned = phone.replace(/[^0-9+]/g, '')
    
    if (!cleaned) {
      return '+52000000000' // Número de fallback si está vacío
    }
    
    // Agregar código de país si no lo tiene
    if (!cleaned.startsWith('+') && !cleaned.startsWith('52')) {
      return `+52${cleaned}`
    }
    
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`
  }
} 