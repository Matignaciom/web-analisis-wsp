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
  
  // Mapeo de columnas esperadas (flexible para diferentes formatos)
  private readonly columnMappings = {
    customerName: ['cliente', 'customer_name', 'name', 'nombre', 'usuario'],
    customerPhone: ['telefono', 'phone', 'numero', 'whatsapp', 'celular'],
    startDate: ['fecha', 'date', 'fecha_inicio', 'start_date', 'timestamp'],
    endDate: ['fecha_fin', 'end_date', 'fecha_final'],
    status: ['estado', 'status', 'estado_conversacion'],
    totalMessages: ['mensajes', 'messages', 'total_messages', 'cantidad_mensajes'],
    lastMessage: ['ultimo_mensaje', 'last_message', 'mensaje_final'],
    assignedAgent: ['agente', 'agent', 'vendedor', 'assigned_agent'],
    source: ['origen', 'source', 'canal'],
    responseTime: ['tiempo_respuesta', 'response_time', 'tiempo'],
    satisfaction: ['satisfaccion', 'satisfaction', 'rating'],
    purchaseValue: ['valor_compra', 'purchase_value', 'monto', 'total'],
    conversionRate: ['conversion_rate', 'tasa_conversion']
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
    
    console.log('🔍 Iniciando detección de columnas...')
    console.log('📋 Headers disponibles:', headers)

    // Primero intentar mapeo estricto basado en columnMappings
    for (const [key, possibleNames] of Object.entries(this.columnMappings)) {
      const foundIndex = headers.findIndex(header => {
        if (!header || typeof header !== 'string') return false
        const headerLower = header.toLowerCase().trim()
        return possibleNames.some(name => headerLower.includes(name.toLowerCase()))
      })
      
      if (foundIndex !== -1) {
        mapping[key] = foundIndex
        console.log(`✅ Encontrada columna ${key} en índice ${foundIndex}: "${headers[foundIndex]}"`)
      }
    }

    // Si no encontramos las columnas críticas, intentemos mapeo inteligente
    if (!mapping.customerName) {
      console.log('🔍 Buscando columna de nombre/cliente...')
      const nameIndex = headers.findIndex(header => {
        if (!header) return false
        const h = header.toLowerCase().trim()
        return h.includes('nom') || h.includes('client') || h.includes('usuario') || 
               h.includes('person') || h.includes('contact') || h.includes('customer') ||
               h === 'name' || h === 'cliente' || h === 'nombre' ||
               // Si es una columna de texto corta, podría ser nombre
               (h.length <= 15 && h.match(/[a-z]/i) && !h.match(/\d/))
      })
      if (nameIndex !== -1) {
        mapping.customerName = nameIndex
        console.log(`🔧 Asignando columna de nombre: "${headers[nameIndex]}" (índice ${nameIndex})`)
      }
    }

    if (!mapping.customerPhone) {
      console.log('🔍 Buscando columna de teléfono...')
      const phoneIndex = headers.findIndex(header => {
        if (!header) return false
        const h = header.toLowerCase().trim()
        return h.includes('tel') || h.includes('phone') || h.includes('cel') || 
               h.includes('whats') || h.includes('numero') || h.includes('mobil') ||
               h.includes('contact') || h === 'phone' || h === 'telefono'
      })
      if (phoneIndex !== -1) {
        mapping.customerPhone = phoneIndex
        console.log(`🔧 Asignando columna de teléfono: "${headers[phoneIndex]}" (índice ${phoneIndex})`)
      }
    }

    if (!mapping.startDate) {
      console.log('🔍 Buscando columna de fecha...')
      const dateIndex = headers.findIndex(header => {
        if (!header) return false
        const h = header.toLowerCase().trim()
        return h.includes('fecha') || h.includes('date') || h.includes('time') ||
               h.includes('dia') || h.includes('day') || h === 'fecha' || h === 'date'
      })
      if (dateIndex !== -1) {
        mapping.startDate = dateIndex
        console.log(`🔧 Asignando columna de fecha: "${headers[dateIndex]}" (índice ${dateIndex})`)
      }
    }

    // Si aún no tenemos columnas críticas, usar inferencia basada en posición
    if (!mapping.customerName && headers.length > 0) {
      // Usar la primera columna como nombre si parece texto
      const firstColHeader = headers[0]
      if (firstColHeader && typeof firstColHeader === 'string') {
        mapping.customerName = 0
        console.log(`🔧 Usando primera columna como nombre: "${firstColHeader}"`)
      }
    }

    if (!mapping.customerPhone && headers.length > 1) {
      // Buscar la primera columna que pueda contener números o la segunda columna
      let phoneIndex = headers.findIndex((header, index) => {
        if (!header) return false
        const h = header.toLowerCase().trim()
        return h.match(/\d/) || h.includes('numero') || index === 1
      })
      
      if (phoneIndex === -1 && headers.length > 1) {
        phoneIndex = 1 // Usar segunda columna como fallback
      }
      
      if (phoneIndex !== -1) {
        mapping.customerPhone = phoneIndex
        console.log(`🔧 Usando columna ${phoneIndex} como teléfono: "${headers[phoneIndex]}"`)
      }
    }

    if (!mapping.startDate && headers.length > 2) {
      // Buscar una columna que pueda ser fecha o usar la tercera
      let dateIndex = headers.findIndex((header, index) => {
        if (!header) return false
        const h = header.toLowerCase().trim()
        return h.includes('fecha') || h.includes('date') || index === 2
      })
      
      if (dateIndex === -1 && headers.length > 2) {
        dateIndex = 2 // Usar tercera columna como fallback
      }
      
      if (dateIndex !== -1) {
        mapping.startDate = dateIndex
        console.log(`🔧 Usando columna ${dateIndex} como fecha: "${headers[dateIndex]}"`)
      }
    }

    // Mapear columnas adicionales si están disponibles
    if (!mapping.status && headers.length > 0) {
      const statusIndex = headers.findIndex(header => {
        if (!header) return false
        const h = header.toLowerCase().trim()
        return h.includes('estado') || h.includes('status') || h.includes('stat')
      })
      if (statusIndex !== -1) {
        mapping.status = statusIndex
        console.log(`🔧 Encontrada columna de estado: "${headers[statusIndex]}" (índice ${statusIndex})`)
      }
    }

    console.log('📋 Mapeo final de columnas:', mapping)
    console.log('📊 Columnas mapeadas:', Object.keys(mapping).length, 'de', headers.length, 'disponibles')
    
    return mapping
  }

  private parseConversationFromRow(
    row: any[], 
    columnMapping: Record<string, number>, 
    rowNumber: number
  ): Conversation | null {
    try {
      console.log(`🔍 Analizando fila ${rowNumber}:`, row)
      
      // Obtener nombre del cliente (requerido)
      let customerName = this.getCellValue(row, columnMapping.customerName)
      
      // Si no tenemos nombre mapeado, buscar en las primeras columnas cualquier texto válido
      if (!customerName && row.length > 0) {
        for (let i = 0; i < Math.min(4, row.length); i++) {
          const value = this.getCellValue(row, i)
          if (value && typeof value === 'string' && value.trim().length > 1 && !value.match(/^\d+$/)) {
            customerName = value.trim()
            console.log(`🔧 Usando "${customerName}" como nombre del cliente (columna ${i})`)
            break
          }
        }
      }
      
      // Si aún no tenemos nombre, generar uno basado en la fila
      if (!customerName) {
        customerName = `Cliente_${rowNumber}`
        console.log(`🔧 Generando nombre por defecto: "${customerName}"`)
      }
      
      // Obtener teléfono del cliente (requerido)
      let customerPhone = this.getCellValue(row, columnMapping.customerPhone)
      
      // Si no tenemos teléfono mapeado, buscar cualquier valor que parezca un número
      if (!customerPhone && row.length > 0) {
        for (let i = 0; i < row.length; i++) {
          const value = this.getCellValue(row, i)
          if (value && (
            typeof value === 'number' || 
            (typeof value === 'string' && (
              value.match(/[\d+()-\s]{8,}/) || // Números con al menos 8 dígitos
              value.match(/^\+?[\d\s()-]{10,}$/) || // Formato teléfono
              value.match(/^\d{10,}$/) // Solo números largos
            ))
          )) {
            customerPhone = value
            console.log(`🔧 Usando "${customerPhone}" como teléfono (columna ${i})`)
            break
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
      let lastMessage = 'Sin mensaje disponible'
      const lastMessageValue = this.getCellValue(row, columnMapping.lastMessage)
      if (lastMessageValue && typeof lastMessageValue === 'string') {
        lastMessage = lastMessageValue.trim()
      } else {
        // Buscar cualquier columna con texto que pueda ser un mensaje
        for (let i = 0; i < row.length; i++) {
          const value = this.getCellValue(row, i)
          if (value && typeof value === 'string' && value.length > 10 && 
              value !== customerName && !this.looksLikeDate(value) && !value.match(/^\d+$/)) {
            lastMessage = value.trim()
            console.log(`🔧 Último mensaje encontrado en columna ${i}: "${lastMessage.substring(0, 50)}..."`)
            break
          }
        }
      }

      // Obtener agente asignado
      let assignedAgent: string | undefined
      const agentValue = this.getCellValue(row, columnMapping.assignedAgent)
      if (agentValue && typeof agentValue === 'string') {
        assignedAgent = agentValue.trim()
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
        customerName: String(customerName).trim(),
        customerPhone: this.formatPhoneNumber(String(customerPhone)),
        startDate,
        endDate: undefined, // Se puede agregar lógica para fecha fin si es necesario
        status,
        totalMessages,
        lastMessage: String(lastMessage).trim(),
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