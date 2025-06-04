import React from 'react'
import type { Conversation } from '@/domain/entities/Conversation'
import styles from './ConversationModal.module.css'

interface ConversationModalProps {
  conversation: Conversation | null
  isOpen: boolean
  onClose: () => void
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
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Cliente:</span>
                <span className={styles.value}>{conversation.customerName}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Teléfono:</span>
                <span className={styles.value}>{conversation.customerPhone}</span>
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
            <div className={styles.aiAnalysis}>
              <div className={styles.aiItem}>
                <span className={styles.aiLabel}>💡 Interés del Cliente:</span>
                <p className={styles.aiValue}>
                  {conversation.interest || 'No identificado'}
                </p>
              </div>
              <div className={styles.aiItem}>
                <span className={styles.aiLabel}>📊 Potencial de Venta:</span>
                <span 
                  className={styles.potentialBadge}
                  style={{ backgroundColor: getSalesPotentialColor(conversation.salesPotential) }}
                >
                  {conversation.salesPotential?.toUpperCase() || 'NO EVALUADO'}
                </span>
              </div>
              <div className={styles.aiItem}>
                <span className={styles.aiLabel}>📝 Resumen:</span>
                <p className={styles.aiValue}>
                  {conversation.aiSummary || '🤖 Generando...'}
                </p>
              </div>
              <div className={styles.aiItem}>
                <span className={styles.aiLabel}>🎯 Sugerencia:</span>
                <p className={styles.aiValue}>
                  {conversation.aiSuggestion || '💡 Analizando...'}
                </p>
              </div>
            </div>
          </div>

          {/* Último mensaje */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>💬 Último Mensaje</h3>
            <div className={styles.messageBox}>
              <p className={styles.messageContent}>
                "{conversation.lastMessage}"
              </p>
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