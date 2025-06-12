import React from 'react'
import { Copy } from 'lucide-react'
import type { Conversation } from '@/domain/entities/Conversation'
import styles from './ConversationModal.module.css'

interface ConversationModalProps {
  conversation: Conversation | null
  isOpen: boolean
  onClose: () => void
}

interface ChatMessage {
  sender: 'customer' | 'agent'
  content: string
  time: string
}

const ConversationModal: React.FC<ConversationModalProps> = ({
  conversation,
  isOpen,
  onClose
}) => {
  if (!isOpen || !conversation) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const getStatusColor = (status: string) => {
    const colors = {
      active: '#10b981',
      completed: '#059669', 
      abandoned: '#ef4444',
      pending: '#f59e0b'
    }
    return colors[status as keyof typeof colors] || '#6b7280'
  }

  const getSalesPotentialColor = (potential?: string) => {
    const colors = {
      high: '#10b981',
      medium: '#f59e0b',
      low: '#ef4444'
    }
    return colors[potential as keyof typeof colors] || '#6b7280'
  }

  const parseWhatsAppMessages = (messageText: string): ChatMessage[] => {
    const messages: ChatMessage[] = []
    
    // Dividir por líneas y filtrar líneas vacías
    const lines = messageText.split('\n').filter(line => line.trim())
    
    for (const line of lines) {
      // Limpiar la línea
      const cleanLine = line.trim()
      if (!cleanLine) continue
      
      // Buscar patrón: - [timestamp] Rol: mensaje
      // o simplemente: - Rol: mensaje
      const timeStampMatch = cleanLine.match(/^-\s*(\d{4}-\d{2}-\d{2}T[\d:.]+Z)?\s*(Cliente|Asesor Comercial):\s*(.+)$/)
      
      if (timeStampMatch) {
        const [, timestamp, role, content] = timeStampMatch
        
        // Determinar el sender
        const sender = role.toLowerCase().includes('cliente') ? 'customer' : 'agent'
        
        // Formatear timestamp
        let time = ''
        if (timestamp) {
          try {
            const date = new Date(timestamp)
            time = formatDate(date)
          } catch {
            time = new Date().toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          }
        } else {
          time = new Date().toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        }
        
        // Limpiar contenido de mensajes especiales
        let cleanContent = content.trim()
        
        // Detectar mensajes de imagen/audio y formatearlos mejor
        if (cleanContent.includes('<image>')) {
          cleanContent = '📷 ' + cleanContent.replace('<image>', '').replace('</image>', '')
        } else if (cleanContent.includes('<audio>')) {
          cleanContent = '🎵 ' + cleanContent.replace('<audio>', '').replace('</audio>', '')
        }
        
        messages.push({
          sender,
          content: cleanContent,
          time
        })
      }
    }
    
    return messages
  }

  const generateChatMessages = (conversation: Conversation): ChatMessage[] => {
    // Si no hay mensajes reales, retornamos array vacío
    if (conversation.lastMessage.includes('[SIN MENSAJES EN DATOS ORIGINALES]')) {
      return []
    }

    // Intentar parsear los mensajes de WhatsApp del formato que viene del Excel
    const parsedMessages = parseWhatsAppMessages(conversation.lastMessage)
    
    // Si se parsearon mensajes exitosamente, usarlos
    if (parsedMessages.length > 0) {
      // Limitar a los últimos 10 mensajes para no sobrecargar la interfaz
      return parsedMessages.slice(-10)
    }
    
    // Si no se pudo parsear, mostrar como mensaje único (fallback)
    return [{
      sender: 'customer',
      content: conversation.lastMessage,
      time: formatDate(conversation.startDate)
    }]
  }

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            👤 Conversación con {conversation.customerName}
          </h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalBody}>
          {/* Información básica */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>📋 Información Básica</h3>
            
            {/* Indicador de calidad de datos */}
            {((conversation.metadata as any)?.incompleteData || 
              (conversation.metadata as any)?.dataQuality?.completenessScore < 0.7) && (
              <div className={styles.dataQualityWarning}>
                ⚠️ <strong>Advertencia:</strong> Los datos de esta conversación son incompletos según el archivo Excel original. 
                Se recomienda validar la información antes de proceder.
                {(conversation.metadata as any)?.dataQuality && (
                  <div className={styles.dataQualityScore}>
                    Completitud de datos: {Math.round((conversation.metadata as any).dataQuality.completenessScore * 100)}%
                  </div>
                )}
              </div>
            )}
            
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Cliente:</span>
                <div className={styles.valueWithIndicator}>
                  <span className={styles.value}>
                    {conversation.customerName}
                    {conversation.customerName.includes('[DATOS INCOMPLETOS]') && (
                      <span className={styles.dataWarning}> (Nombre no disponible en archivo original)</span>
                    )}
                  </span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Teléfono:</span>
                <div className={styles.valueWithIndicator}>
                  <span className={styles.value}>
                    {conversation.customerPhone}
                    {conversation.customerPhone.includes('[SIN TELÉFONO EN DATOS ORIGINALES]') && (
                      <span className={styles.dataWarning}> (Teléfono no disponible en archivo original)</span>
                    )}
                  </span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Estado:</span>
                <span 
                  className={styles.statusBadge}
                  style={{ backgroundColor: getStatusColor(conversation.status) }}
                >
                  {conversation.status}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Mensajes:</span>
                <span className={styles.value}>{conversation.totalMessages}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Fecha inicio:</span>
                <span className={styles.value}>{formatDate(conversation.startDate)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Agente:</span>
                <span className={styles.value}>{conversation.assignedAgent || 'Sin asignar'}</span>
              </div>
            </div>
          </div>

          {/* Análisis de IA */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>🤖 Análisis de IA</h3>
            
            {/* Indicador de confiabilidad del análisis */}
            {((conversation.metadata as any)?.incompleteData || 
              (conversation.metadata as any)?.dataQuality?.completenessScore < 0.5) && (
              <div className={styles.aiReliabilityWarning}>
                🔍 <strong>Nota:</strong> Este análisis de IA está basado en datos limitados del archivo Excel. 
                Los resultados pueden requerir validación adicional.
              </div>
            )}
            
            <div className={styles.aiAnalysis}>
              <div className={styles.aiItem}>
                <span className={styles.aiLabel}>💡 Interés del Cliente:</span>
                <div className={styles.aiContentBox}>
                  <p className={styles.aiValue}>
                    {conversation.interest || 'Analizando...'}
                    {conversation.interest?.includes('Datos insuficientes') && (
                      <span className={styles.aiLimitation}> (Basado en datos limitados)</span>
                    )}
                  </p>
                  {conversation.interest && (
                    <button
                      className={styles.copyIconButton}
                      onClick={() => {
                        navigator.clipboard.writeText(conversation.interest!)
                          .then(() => alert('✅ Interés copiado'))
                          .catch(() => alert('❌ Error al copiar'))
                      }}
                      title="Copiar interés"
                    >
                      <Copy size={14} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className={styles.aiItem}>
                <span className={styles.aiLabel}>📊 Potencial de Venta:</span>
                <span 
                  className={styles.potentialBadge}
                  style={{ backgroundColor: getSalesPotentialColor(conversation.salesPotential) }}
                >
                  {conversation.salesPotential?.toUpperCase() || 'EVALUANDO...'}
                </span>
              </div>
              
              <div className={styles.aiItem}>
                <span className={styles.aiLabel}>📝 Resumen Completo:</span>
                <div className={styles.aiContentBox}>
                  <div className={styles.expandedAiText}>
                    {conversation.aiSummary || '🤖 Generando resumen...'}
                    {conversation.aiSummary?.includes('Datos limitados') && (
                      <div className={styles.dataLimitationNote}>
                        📊 Este resumen está basado en la información disponible en el archivo Excel original.
                      </div>
                    )}
                  </div>
                  {conversation.aiSummary && (
                    <button
                      className={styles.copyIconButton}
                      onClick={() => {
                        navigator.clipboard.writeText(conversation.aiSummary!)
                          .then(() => alert('✅ Resumen copiado'))
                          .catch(() => alert('❌ Error al copiar'))
                      }}
                      title="Copiar resumen completo"
                    >
                      <Copy size={14} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className={styles.aiItem}>
                <span className={styles.aiLabel}>🎯 Sugerencia de Acción:</span>
                <div className={styles.aiContentBox}>
                  <div className={styles.expandedAiText}>
                    {conversation.aiSuggestion || '💡 Analizando y generando sugerencia...'}
                    {conversation.aiSuggestion?.includes('Validar y completar') && (
                      <div className={styles.validationNote}>
                        ⚠️ Se recomienda validar los datos del cliente antes de proceder con acciones comerciales.
                      </div>
                    )}
                  </div>
                  {conversation.aiSuggestion && (
                    <button
                      className={styles.copyIconButton}
                      onClick={() => {
                        navigator.clipboard.writeText(conversation.aiSuggestion!)
                          .then(() => alert('✅ Sugerencia copiada'))
                          .catch(() => alert('❌ Error al copiar'))
                      }}
                      title="Copiar sugerencia completa"
                    >
                      <Copy size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Conversación */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>💬 Conversación</h3>
            <div className={styles.chatContainer}>
              <div className={styles.chatHeader}>
                <span className={styles.chatInfo}>
                  📅 {formatDate(conversation.startDate)} • {conversation.totalMessages} mensajes
                </span>
                <button
                  className={styles.copyIconButton}
                  onClick={() => {
                    navigator.clipboard.writeText(conversation.lastMessage)
                      .then(() => alert('✅ Conversación copiada'))
                      .catch(() => alert('❌ Error al copiar'))
                  }}
                  title="Copiar conversación"
                >
                  <Copy size={14} />
                </button>
              </div>
              
              {conversation.lastMessage.includes('[SIN MENSAJES EN DATOS ORIGINALES]') ? (
                <div className={styles.noMessagesState}>
                  <h4>📝 Sin mensajes disponibles</h4>
                  <p>No se encontraron mensajes en el archivo Excel original para esta conversación.</p>
                </div>
              ) : (
                <div className={styles.messagesContainer}>
                  {/* Simulamos mensajes basados en el análisis de IA y datos disponibles */}
                  {generateChatMessages(conversation).map((message, index) => (
                    <div key={index} className={`${styles.messageRow} ${styles[message.sender]}`}>
                      <div className={`${styles.messageBubble} ${styles[message.sender]}`}>
                        <div className={`${styles.messageLabel} ${styles[message.sender]}`}>
                          {message.sender === 'customer' ? '👤 Cliente' : '💬 Recepción'}
                        </div>
                        <p className={styles.messageContent}>{message.content}</p>
                        <div className={styles.messageTime}>
                          {message.time}
                        </div>
                        <button
                          className={styles.copyButton}
                          onClick={() => {
                            navigator.clipboard.writeText(message.content)
                              .then(() => alert('✅ Mensaje copiado'))
                              .catch(() => alert('❌ Error al copiar'))
                          }}
                          title="Copiar mensaje"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Metadatos */}
          {conversation.metadata && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>⚙️ Metadatos</h3>
              <div className={styles.metadataGrid}>
                <div className={styles.metadataItem}>
                  <span className={styles.label}>Origen:</span>
                  <span className={styles.value}>{conversation.metadata.source}</span>
                </div>
                <div className={styles.metadataItem}>
                  <span className={styles.label}>Tiempo de respuesta:</span>
                  <span className={styles.value}>{conversation.metadata.responseTime} min</span>
                </div>
                {conversation.metadata.satisfaction && (
                  <div className={styles.metadataItem}>
                    <span className={styles.label}>Satisfacción:</span>
                    <span className={styles.value}>
                      {conversation.metadata.satisfaction}/5 ⭐
                    </span>
                  </div>
                )}
                {conversation.metadata.totalPurchaseValue && (
                  <div className={styles.metadataItem}>
                    <span className={styles.label}>Valor de compra:</span>
                    <span className={styles.value}>
                      {formatCurrency(conversation.metadata.totalPurchaseValue)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {conversation.tags && conversation.tags.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>🏷️ Etiquetas</h3>
              <div className={styles.tagsContainer}>
                {conversation.tags.map((tag, index) => (
                  <span key={index} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button 
            className={styles.secondaryButton}
            onClick={onClose}
          >
            Cerrar
          </button>
          <button 
            className={styles.primaryButton}
            onClick={() => {
              // Copiar información completa al clipboard
              const fullInfo = `
Conversación: ${conversation.customerName}
Teléfono: ${conversation.customerPhone}
Estado: ${conversation.status}
Mensajes: ${conversation.totalMessages}
Interés: ${conversation.interest || 'No identificado'}
Potencial: ${conversation.salesPotential || 'No evaluado'}
Resumen IA: ${conversation.aiSummary || 'Generando...'}
Sugerencia IA: ${conversation.aiSuggestion || 'Analizando...'}
Último mensaje: "${conversation.lastMessage}"
Agente: ${conversation.assignedAgent || 'Sin asignar'}
              `.trim()
              
              navigator.clipboard.writeText(fullInfo)
                .then(() => alert('✅ Información copiada al portapapeles'))
                .catch(() => alert('❌ Error al copiar'))
            }}
          >
            📋 Copiar Todo
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConversationModal 