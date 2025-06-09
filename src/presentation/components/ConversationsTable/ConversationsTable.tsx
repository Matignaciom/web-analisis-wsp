import React, { useState } from 'react'
import type { Conversation } from '@/domain/entities/Conversation'
import styles from './ConversationsTable.module.css'

interface ConversationsTableProps {
  conversations: Conversation[]
  onViewConversation?: (conversation: Conversation) => void
}

const ConversationsTable: React.FC<ConversationsTableProps> = ({ 
  conversations, 
  onViewConversation 
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleCopy = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldId)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('Error al copiar:', error)
    }
  }

  const getSalesPotentialBadge = (potential?: string) => {
    const badges = {
      high: { label: 'Alto', color: 'success' },
      medium: { label: 'Medio', color: 'warning' },
      low: { label: 'Bajo', color: 'neutral' }
    }
    
    if (!potential) return null
    const badge = badges[potential as keyof typeof badges]
    
    return (
      <span className={`${styles.badge} ${styles[`badge-${badge.color}`]}`}>
        {badge.label}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: '🟢 Activo', color: 'success' },
      completed: { label: '✅ Completado', color: 'success' },
      abandoned: { label: '🔴 Abandonado', color: 'danger' },
      pending: { label: '⏳ Pendiente', color: 'warning' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    return (
      <span className={`${styles.badge} ${styles[`badge-${config.color}`]}`}>
        {config.label}
      </span>
    )
  }

  const CopyableField: React.FC<{ 
    text: string, 
    fieldId: string, 
    maxLength?: number,
    showFullText?: boolean
  }> = ({ text, fieldId, maxLength = 50, showFullText = false }) => {
    const displayText = showFullText || text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`
    const isCopied = copiedField === fieldId
    
    return (
      <div className={styles.copyableField}>
        <span className={styles.fieldText} title={text} style={{
          whiteSpace: showFullText ? 'normal' : 'nowrap',
          wordWrap: showFullText ? 'break-word' : 'normal',
          overflow: showFullText ? 'visible' : 'hidden',
          textOverflow: showFullText ? 'unset' : 'ellipsis'
        }}>
          {displayText}
        </span>
        <button
          className={`${styles.copyButton} ${isCopied ? styles.copied : ''}`}
          onClick={() => handleCopy(text, fieldId)}
          title={isCopied ? 'Copiado!' : 'Copiar'}
        >
          {isCopied ? '✓' : '📋'}
        </button>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h3>📤 No hay conversaciones disponibles</h3>
        <p>Sube un archivo para comenzar el análisis</p>
      </div>
    )
  }

  return (
    <div className={styles.tableContainer}>
      <div style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '12px 12px 0 0',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: '600'
      }}>
        📊 ANÁLISIS INTELIGENTE DE CONVERSACIONES • 📋 TODOS LOS TEXTOS COPIABLES
      </div>
      
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Número</th>
              <th>🤖 Interés (IA)</th>
              <th>🎯 Potencial (IA)</th>
              <th>Estado</th>
              <th>📝 Resumen IA (Copiable)</th>
              <th>💡 Sugerencia IA (Copiable)</th>
              <th>Agente</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {conversations.map(conv => (
              <tr key={conv.id} className={styles.tableRow}>
                <td className={styles.customerCell}>
                  <div className={styles.customerInfo}>
                    <span className={styles.customerName}>{conv.customerName}</span>
                    <span className={styles.messageCount}>
                      {conv.totalMessages} mensajes
                    </span>
                  </div>
                </td>
                
                <td className={styles.phoneCell}>
                  <CopyableField 
                    text={conv.customerPhone} 
                    fieldId={`phone-${conv.id}`}
                    showFullText={true}
                  />
                </td>
                
                <td className={styles.interestCell}>
                  {conv.interest ? (
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#10b981',
                        color: 'white',
                        fontSize: '10px',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        zIndex: 1
                      }}>
                        IA
                      </div>
                      <CopyableField 
                        text={conv.interest} 
                        fieldId={`interest-${conv.id}`}
                        showFullText={true}
                      />
                    </div>
                  ) : (
                    <span className={styles.noData}>🤖 Analizando...</span>
                  )}
                </td>
                
                <td className={styles.potentialCell}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#f59e0b',
                      color: 'white',
                      fontSize: '10px',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      zIndex: 1
                    }}>
                      IA
                    </div>
                    {getSalesPotentialBadge(conv.salesPotential)}
                  </div>
                </td>
                
                <td className={styles.statusCell}>
                  {getStatusBadge(conv.status)}
                </td>
                
                <td className={styles.aiSummaryCell}>
                  {conv.aiSummary ? (
                    <div style={{
                      background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                      border: '1px solid #10b981',
                      borderRadius: '8px',
                      padding: '8px',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '-6px',
                        left: '8px',
                        background: '#10b981',
                        color: 'white',
                        fontSize: '9px',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontWeight: 'bold'
                      }}>
                        📝 RESUMEN
                      </div>
                      <CopyableField 
                        text={conv.aiSummary} 
                        fieldId={`summary-${conv.id}`}
                        showFullText={true}
                      />
                    </div>
                  ) : (
                    <span className={styles.generating} style={{
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid #f59e0b'
                    }}>
                      🤖 IA Generando...
                    </span>
                  )}
                </td>
                
                <td className={styles.aiSuggestionCell}>
                  {conv.aiSuggestion ? (
                    <div style={{
                      background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                      border: '1px solid #3b82f6',
                      borderRadius: '8px',
                      padding: '8px',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '-6px',
                        left: '8px',
                        background: '#3b82f6',
                        color: 'white',
                        fontSize: '9px',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontWeight: 'bold'
                      }}>
                        💡 SUGERENCIA
                      </div>
                      <CopyableField 
                        text={conv.aiSuggestion} 
                        fieldId={`suggestion-${conv.id}`}
                        showFullText={true}
                      />
                    </div>
                  ) : (
                    <span className={styles.generating} style={{
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid #f59e0b'
                    }}>
                      💡 IA Analizando...
                    </span>
                  )}
                </td>
                
                <td className={styles.agentCell}>
                  {conv.assignedAgent || (
                    <span className={styles.noData}>Sin asignar</span>
                  )}
                </td>
                
                <td className={styles.actionsCell}>
                  <button
                    className={styles.viewButton}
                    onClick={() => onViewConversation?.(conv)}
                    title="Ver análisis completo generado por IA"
                  >
                    👁️ Ver IA
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className={styles.tableFooter}>
        <span className={styles.resultsCount}>
          📊 {conversations.length} conversación{conversations.length !== 1 ? 'es' : ''} analizada{conversations.length !== 1 ? 's' : ''} con análisis inteligente
        </span>
      </div>
    </div>
  )
}

export default ConversationsTable 