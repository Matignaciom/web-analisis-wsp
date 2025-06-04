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
    maxLength?: number 
  }> = ({ text, fieldId, maxLength = 50 }) => {
    const displayText = text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
    const isCopied = copiedField === fieldId
    
    return (
      <div className={styles.copyableField}>
        <span className={styles.fieldText} title={text}>
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
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Número</th>
              <th>Interés</th>
              <th>Potencial</th>
              <th>Estado</th>
              <th>Resumen IA</th>
              <th>Sugerencia IA</th>
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
                    maxLength={15}
                  />
                </td>
                
                <td className={styles.interestCell}>
                  {conv.interest ? (
                    <CopyableField 
                      text={conv.interest} 
                      fieldId={`interest-${conv.id}`}
                      maxLength={30}
                    />
                  ) : (
                    <span className={styles.noData}>Sin definir</span>
                  )}
                </td>
                
                <td className={styles.potentialCell}>
                  {getSalesPotentialBadge(conv.salesPotential)}
                </td>
                
                <td className={styles.statusCell}>
                  {getStatusBadge(conv.status)}
                </td>
                
                <td className={styles.aiSummaryCell}>
                  {conv.aiSummary ? (
                    <CopyableField 
                      text={conv.aiSummary} 
                      fieldId={`summary-${conv.id}`}
                      maxLength={60}
                    />
                  ) : (
                    <span className={styles.generating}>
                      🤖 Generando...
                    </span>
                  )}
                </td>
                
                <td className={styles.aiSuggestionCell}>
                  {conv.aiSuggestion ? (
                    <CopyableField 
                      text={conv.aiSuggestion} 
                      fieldId={`suggestion-${conv.id}`}
                      maxLength={60}
                    />
                  ) : (
                    <span className={styles.generating}>
                      💡 Analizando...
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
                    title="Ver conversación completa"
                  >
                    👁️ Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className={styles.tableFooter}>
        <span className={styles.resultsCount}>
          {conversations.length} conversación{conversations.length !== 1 ? 'es' : ''} encontrada{conversations.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}

export default ConversationsTable 