import React, { useState, useMemo } from 'react'
import type { Conversation } from '@/domain/entities/Conversation'
import { useExport } from '@/hooks/useExport'
import { useDynamicDashboard } from '@/hooks/useDynamicDashboard'
import { SentimentLabel, IntentType } from '@/domain/entities/AnalysisResult'
import styles from './DetailedAnalysisTable.module.css'

interface DetailedAnalysisTableProps {
  conversations: Conversation[]
  selectedAIFilters: string[]
  onRemoveAIFilter: (filterId: string) => void
  onViewConversation?: (conversation: Conversation) => void
}

type StatusFilter = 'todas' | 'iniciadas' | 'abandonadas' | 'ventas'

const DetailedAnalysisTable: React.FC<DetailedAnalysisTableProps> = ({
  conversations,
  selectedAIFilters,
  onRemoveAIFilter,
  onViewConversation
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todas')
  const [searchTerm, setSearchTerm] = useState('')
  const { exportToExcel, exportToPDF, isExporting } = useExport()
  
  // Obtener dashboard dinámico para incluir en exportaciones
  const { dashboard } = useDynamicDashboard({
    conversations,
    autoUpdate: false
  })

  // Filtrar conversaciones basado en filtros de IA, estado y búsqueda
  const filteredConversations = useMemo(() => {
    let filtered = [...conversations]

    // Aplicar filtro de búsqueda
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(conv => 
        conv.customerName?.toLowerCase().includes(searchLower) ||
        conv.customerPhone?.includes(searchTerm) ||
        conv.lastMessage?.toLowerCase().includes(searchLower) ||
        conv.aiSummary?.toLowerCase().includes(searchLower) ||
        conv.aiSuggestion?.toLowerCase().includes(searchLower) ||
        conv.interest?.toLowerCase().includes(searchLower) ||
        conv.assignedAgent?.toLowerCase().includes(searchLower)
      )
    }

    // Aplicar filtros de IA
    if (selectedAIFilters.length > 0) {
      filtered = filtered.filter(conv => {
        return selectedAIFilters.some(filterId => {
          switch (filterId) {
            case 'proactive':
              return conv.aiSuggestion?.toLowerCase().includes('iniciar') ||
                     conv.aiSuggestion?.toLowerCase().includes('proactiv') ||
                     conv.aiSuggestion?.toLowerCase().includes('contactar') ||
                     conv.status === 'pending'
            case 'followUp':
              return conv.aiSuggestion?.toLowerCase().includes('seguimiento') ||
                     conv.aiSuggestion?.toLowerCase().includes('follow') ||
                     conv.aiSuggestion?.toLowerCase().includes('continuar') ||
                     conv.status === 'active'
            case 'pricing':
              return conv.interest?.toLowerCase().includes('precio') ||
                     conv.interest?.toLowerCase().includes('costo') ||
                     conv.interest?.toLowerCase().includes('cuanto') ||
                     conv.lastMessage?.toLowerCase().includes('precio')
            case 'support':
              return conv.interest?.toLowerCase().includes('soporte') ||
                     conv.interest?.toLowerCase().includes('ayuda') ||
                     conv.interest?.toLowerCase().includes('problema') ||
                     conv.aiSuggestion?.toLowerCase().includes('soporte')
            case 'negotiation':
              return conv.aiSuggestion?.toLowerCase().includes('negocia') ||
                     conv.aiSuggestion?.toLowerCase().includes('oferta') ||
                     conv.aiSuggestion?.toLowerCase().includes('descuento') ||
                     conv.salesPotential === 'high'
            case 'general':
              return conv.interest?.toLowerCase().includes('general') ||
                     conv.interest?.toLowerCase().includes('información') ||
                     (!conv.interest || conv.interest === 'Sin definir')
            default:
              return false
          }
        })
      })
    }

    // Aplicar filtro de estado
    switch (statusFilter) {
      case 'iniciadas':
        filtered = filtered.filter(conv => conv.status === 'active' || conv.status === 'completed')
        break
      case 'abandonadas':
        filtered = filtered.filter(conv => conv.status === 'abandoned')
        break
      case 'ventas':
        filtered = filtered.filter(conv => conv.status === 'completed' || conv.salesPotential === 'high')
        break
      case 'todas':
      default:
        // No filtrar por estado
        break
    }

    return filtered
  }, [conversations, selectedAIFilters, statusFilter, searchTerm])

  const handleCopy = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldId)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('Error al copiar:', error)
    }
  }

  // Crear datos enriquecidos para exportación
  const createExportData = () => {
    const analysisResults = filteredConversations
      .filter(conv => conv.aiSummary || conv.aiSuggestion || conv.interest || conv.salesPotential)
      .map(conv => ({
        id: `ai-analysis-${conv.id}`,
        conversationId: conv.id,
        timestamp: new Date(),
        sentiment: {
          score: conv.salesPotential === 'high' ? 0.8 : conv.salesPotential === 'medium' ? 0.5 : 0.2,
          label: conv.salesPotential === 'high' ? SentimentLabel.POSITIVE : 
                conv.salesPotential === 'medium' ? SentimentLabel.NEUTRAL : SentimentLabel.NEGATIVE,
          confidence: 0.85,
          keywords: conv.interest ? [conv.interest] : []
        },
        intent: {
          primary: {
            type: IntentType.GENERAL_INFO,
            category: 'General',
            description: conv.interest || 'Información general',
            confidence: 0.8
          },
          confidence: 0.8
        },
        summary: conv.aiSummary || `Conversación con ${conv.customerName} - ${conv.totalMessages} mensajes`,
        keyInsights: conv.aiSuggestion ? [conv.aiSuggestion] : ['Análisis en proceso'],
        recommendations: conv.aiSuggestion ? [conv.aiSuggestion] : ['Seguimiento recomendado'],
        confidence: 0.85
      }))

    return {
      conversations: filteredConversations,
      analysisResults,
      metrics: dashboard?.mainMetrics,
      dynamicMetrics: dashboard?.dynamicMetrics || [],
      aiInsights: dashboard?.insights
    }
  }

  const handleExportExcel = async () => {
    if (filteredConversations.length === 0) return
    
    try {
      const exportData = createExportData()
      await exportToExcel(exportData, {
        includeAnalysis: true,
        includeMetrics: true,
        includeCharts: true
      })
    } catch (error) {
      console.error('Error exportando a Excel:', error)
    }
  }

  const handleExportPDF = async () => {
    if (filteredConversations.length === 0) return
    
    try {
      const exportData = createExportData()
      await exportToPDF(exportData, {
        includeAnalysis: true,
        includeMetrics: true,
        includeCharts: true
      })
    } catch (error) {
      console.error('Error exportando a PDF:', error)
    }
  }

  const getAIFilterDisplayName = (filterId: string): string => {
    const filterNames: Record<string, string> = {
      proactive: 'Iniciar conversación proactiva',
      followUp: 'Realizar seguimiento',
      pricing: 'Consultas de precios',
      support: 'Soporte y ayuda',
      negotiation: 'Oportunidades de venta',
      general: 'Información general'
    }
    return filterNames[filterId] || filterId
  }

  const getSalesPotentialBadge = (potential?: string) => {
    const badges = {
      high: { label: 'Alto', color: 'success' },
      medium: { label: 'Medio', color: 'warning' },
      low: { label: 'Bajo', color: 'neutral' }
    }
    
    if (!potential) return <span className={`${styles.badge} ${styles.neutral}`}>Sin evaluar</span>
    const badge = badges[potential as keyof typeof badges]
    
    return (
      <span className={`${styles.badge} ${styles[badge.color]}`}>
        {badge.label}
      </span>
    )
  }

  const CopyableField: React.FC<{ 
    text: string, 
    fieldId: string, 
    maxLength?: number,
    showFullText?: boolean
  }> = ({ text, fieldId, maxLength = 50, showFullText = false }) => {
    const displayText = showFullText || text.length <= maxLength 
      ? text 
      : `${text.substring(0, maxLength)}...`
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

  const statusFilterButtons: Array<{ id: StatusFilter; label: string; icon: string }> = [
    { id: 'todas', label: 'Todas', icon: '📊' },
    { id: 'iniciadas', label: 'Iniciadas', icon: '🟢' },
    { id: 'abandonadas', label: 'Abandonadas', icon: '🔴' },
    { id: 'ventas', label: 'Ventas', icon: '💜' }
  ]

  return (
    <div className={styles.analysisContainer}>
      {/* Header */}
      <div className={styles.analysisHeader}>
        <h3 className={styles.analysisTitle}>🔍 Conversaciones Analizadas</h3>
        <div className={styles.headerActions}>
          <button
            className={`${styles.exportButton} ${styles.pdfButton}`}
            onClick={handleExportPDF}
            disabled={isExporting || filteredConversations.length === 0}
            title="Exportar a PDF"
          >
            📄 Exportar a PDF
          </button>
          <button
            className={styles.exportButton}
            onClick={handleExportExcel}
            disabled={isExporting || filteredConversations.length === 0}
            title="Exportar a Excel"
          >
            📊 Exportar a Excel
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className={styles.searchContainer}>
        <div className={styles.searchInputWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Buscar por cliente, teléfono, mensaje, resumen o sugerencia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button
              className={styles.clearSearch}
              onClick={() => setSearchTerm('')}
              title="Limpiar búsqueda"
            >
              ×
            </button>
          )}
        </div>
        {searchTerm && (
          <div className={styles.searchResults}>
            Mostrando {filteredConversations.length} de {conversations.length} conversaciones
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className={styles.filtersSection}>
        {/* Filtros de IA activos */}
        <div className={styles.activeFiltersContainer}>
          <span className={styles.filterLabel}>Filtrando por:</span>
          {selectedAIFilters.length > 0 ? (
            selectedAIFilters.map(filterId => (
              <div key={filterId} className={styles.filterChip}>
                <span className={styles.filterText}>
                  ⭐ {getAIFilterDisplayName(filterId)}
                </span>
                <button
                  className={styles.removeFilter}
                  onClick={() => onRemoveAIFilter(filterId)}
                  title="Quitar filtro"
                >
                  ×
                </button>
              </div>
            ))
          ) : (
            <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>
              Sin filtros de IA aplicados
            </span>
          )}
        </div>

        {/* Filtros de estado */}
        <div className={styles.statusFilters}>
          {statusFilterButtons.map(button => (
            <button
              key={button.id}
              className={`${styles.statusFilterButton} ${styles[button.id]} ${
                statusFilter === button.id ? styles.active : ''
              }`}
              onClick={() => setStatusFilter(button.id)}
            >
              {button.icon} {button.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contador de resultados */}
      <div className={styles.resultsCount}>
        📊 Mostrando {filteredConversations.length} de {conversations.length} conversaciones
        {selectedAIFilters.length > 0 && (
          <span style={{ color: '#3b82f6', fontWeight: '500' }}>
            {' '}(filtradas por IA)
          </span>
        )}
        {searchTerm && (
          <span style={{ color: '#059669', fontWeight: '500' }}>
            {' '}(búsqueda activa)
          </span>
        )}
      </div>

      {/* Tabla */}
      <div className={styles.tableContainer}>
        {filteredConversations.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>CLIENTE</th>
                <th>INTERÉS DETECTADO</th>
                <th>POTENCIAL VENTA</th>
                <th>📝 RESUMEN COMPLETO IA</th>
                <th>🎯 SUGERENCIA ACCIÓN IA</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filteredConversations.map(conv => (
                <tr key={conv.id}>
                  <td className={styles.customerCell}>
                    <div>
                      <span className={styles.customerName}>
                        {conv.customerName}
                      </span>
                      <div className={styles.phoneContainer}>
                        <CopyableField 
                          text={conv.customerPhone} 
                          fieldId={`phone-${conv.id}`}
                          maxLength={20}
                        />
                      </div>
                    </div>
                  </td>
                  
                  <td>
                    {conv.interest ? (
                      <CopyableField 
                        text={conv.interest} 
                        fieldId={`interest-${conv.id}`}
                        showFullText={true}
                      />
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                        🤖 Sin analizar
                      </span>
                    )}
                  </td>
                  
                  <td>
                    {getSalesPotentialBadge(conv.salesPotential)}
                  </td>
                  
                  <td className={styles.aiSummaryCell}>
                    {conv.aiSummary ? (
                      <div className={styles.aiContent}>
                        <div className={styles.expandableText} title={conv.aiSummary}>
                          {conv.aiSummary}
                        </div>
                        <button
                          className={styles.copyButton}
                          onClick={() => handleCopy(conv.aiSummary!, `summary-${conv.id}`)}
                          title={copiedField === `summary-${conv.id}` ? 'Copiado!' : 'Copiar resumen'}
                        >
                          {copiedField === `summary-${conv.id}` ? '✓' : '📋'}
                        </button>
                      </div>
                    ) : (
                      <div className={styles.generatingMessage}>
                        <span className={styles.generatingIcon}>🤖</span>
                        <span>Generando resumen...</span>
                      </div>
                    )}
                  </td>
                  
                  <td className={styles.aiSuggestionCell}>
                    {conv.aiSuggestion ? (
                      <div className={styles.aiContent}>
                        <div className={styles.expandableText} title={conv.aiSuggestion}>
                          {conv.aiSuggestion}
                        </div>
                        <button
                          className={styles.copyButton}
                          onClick={() => handleCopy(conv.aiSuggestion!, `suggestion-${conv.id}`)}
                          title={copiedField === `suggestion-${conv.id}` ? 'Copiado!' : 'Copiar sugerencia'}
                        >
                          {copiedField === `suggestion-${conv.id}` ? '✓' : '📋'}
                        </button>
                      </div>
                    ) : (
                      <div className={styles.generatingMessage}>
                        <span className={styles.generatingIcon}>💡</span>
                        <span>Analizando y generando sugerencia...</span>
                      </div>
                    )}
                  </td>
                  
                  <td>
                    <button
                      className={styles.viewButton}
                      onClick={() => onViewConversation?.(conv)}
                      title="Ver análisis completo y detalles de la conversación"
                    >
                      👁️ Ver Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.emptyState}>
            <h3>🔍 No se encontraron conversaciones</h3>
            <p>
              {selectedAIFilters.length > 0 || statusFilter !== 'todas'
                ? 'Prueba ajustando los filtros para ver más resultados'
                : 'No hay conversaciones disponibles para mostrar'
              }
            </p>
          </div>
        )}
      </div>

      {/* Footer con contador */}
      {filteredConversations.length > 0 && (
        <div className={styles.resultsCount}>
          Mostrando {filteredConversations.length} de {conversations.length} conversaciones
          {selectedAIFilters.length > 0 && ` · Filtro IA activo`}
          {statusFilter !== 'todas' && ` · Estado: ${statusFilterButtons.find(b => b.id === statusFilter)?.label}`}
        </div>
      )}
    </div>
  )
}

export default DetailedAnalysisTable 