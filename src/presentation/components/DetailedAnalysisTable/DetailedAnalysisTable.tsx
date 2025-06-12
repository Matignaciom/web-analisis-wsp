import React, { useState, useMemo } from 'react'
import { Copy } from 'lucide-react'
import type { Conversation } from '@/domain/entities/Conversation'
import { useExport } from '@/hooks/useExport'
import { useDynamicDashboard } from '@/hooks/useDynamicDashboard'

import styles from './DetailedAnalysisTable.module.css'

interface DetailedAnalysisTableProps {
  conversations: Conversation[]
  selectedAIFilters: string[]
  onRemoveAIFilter: (filterId: string) => void
  onViewConversation?: (conversation: Conversation) => void
}

type StatusFilter = string // Ahora es dinámico

interface StatusFilterWithMetrics {
  id: StatusFilter
  label: string
  icon: string
  count: number
  percentage: number
  description: string
  priority: 'high' | 'medium' | 'low' | 'neutral'
  filterLogic: (conv: Conversation) => boolean
}

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
  
  // Obtener dashboard dinámico para incluir en exportaciones y filtros inteligentes
  const { dashboard } = useDynamicDashboard({
    conversations,
    autoUpdate: false
  })

  // 🔧 CONFIGURACIÓN DINÁMICA DE STATUS
  const getStatusConfig = (status: string, _count: number, _total: number, rate: number, _metrics?: any) => {
    const statusMap: Record<string, any> = {
      'completed': {
        label: 'Completadas',
        icon: '✅',
        description: `🏆 ${rate.toFixed(1)}% conversaciones completadas exitosamente`,
        priority: 'high'
      },
      'active': {
        label: 'Activas',
        icon: rate > 50 ? '🟢' : rate > 20 ? '🔄' : '⚠️',
        description: rate > 50 ? `📈 Alta actividad: ${rate.toFixed(1)}% en progreso` : 
                    rate > 20 ? `📊 Actividad moderada: ${rate.toFixed(1)}%` : 
                    `📉 Baja actividad: ${rate.toFixed(1)}%`,
        priority: rate > 30 ? 'high' : 'medium'
      },
      'pending': {
        label: 'Pendientes',
        icon: '⏳',
        description: `⏳ ${rate.toFixed(1)}% esperando respuesta o acción`,
        priority: rate > 30 ? 'medium' : 'low'
      },
      'abandoned': {
        label: 'Abandonadas',
        icon: rate > 30 ? '🚨' : '🔴',
        description: rate > 30 ? `🚨 CRÍTICO: ${rate.toFixed(1)}% abandonadas` : 
                    `📉 ${rate.toFixed(1)}% abandonadas - oportunidad de recuperación`,
        priority: rate > 30 ? 'high' : 'medium'
      },
      'sin_definir': {
        label: 'Sin definir',
        icon: '❓',
        description: `❓ ${rate.toFixed(1)}% sin status definido - requiere clasificación`,
        priority: 'medium'
      }
    }
    
    return statusMap[status] || {
      label: status.charAt(0).toUpperCase() + status.slice(1),
      icon: '📝',
      description: `📝 ${rate.toFixed(1)}% con status: ${status}`,
      priority: 'low'
    }
  }
  
  // 🎯 CONFIGURACIÓN DINÁMICA DE POTENCIAL
  const getPotentialConfig = (potential: string, _count: number, _total: number, percentage: number) => {
    const potentialMap: Record<string, any> = {
      'high': {
        label: 'Alto Potencial',
        icon: '🎯',
        description: `🎯 ${percentage}% con alto potencial de conversión`,
        priority: 'high'
      },
      'medium': {
        label: 'Potencial Medio',
        icon: '📈',
        description: `📈 ${percentage}% con potencial moderado`,
        priority: 'medium'
      },
      'low': {
        label: 'Bajo Potencial',
        icon: '📊',
        description: `📊 ${percentage}% con potencial bajo`,
        priority: 'low'
      }
    }
    
    return potentialMap[potential] || {
      label: `Potencial ${potential}`,
      icon: '📋',
      description: `📋 ${percentage}% clasificado como: ${potential}`,
      priority: 'neutral'
    }
  }

  // 🚀 GENERAR FILTROS DINÁMICOS BASADOS EN DATOS REALES
  const statusFiltersWithMetrics = useMemo((): StatusFilterWithMetrics[] => {
    const total = conversations.length
    if (total === 0) return []
    
    // Obtener métricas del dashboard para contexto
    const metrics = dashboard?.mainMetrics
    
    // 1. ANÁLISIS DINÁMICO DE STATUS EXISTENTES
    const statusCounts = conversations.reduce((acc, conv) => {
      const status = conv.status || 'sin_definir'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // 2. ANÁLISIS DINÁMICO DE POTENCIAL DE VENTAS
    const salesPotentialCounts = conversations.reduce((acc, conv) => {
      const potential = conv.salesPotential || 'no_evaluado'
      acc[potential] = (acc[potential] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log('🔍 Análisis dinámico:', { statusCounts, salesPotentialCounts, total })
    
    // 3. CREAR FILTROS DINÁMICOS
    const filters: StatusFilterWithMetrics[] = []
    
    // Filtro "Todas" (siempre presente)
    filters.push({
      id: 'todas',
      label: 'Todas',
      icon: '📊',
      count: total,
      percentage: 100,
      description: metrics 
        ? `Vista completa: ${metrics.conversionRate.toFixed(1)}% conversión`
        : 'Vista completa de todas las conversaciones',
      priority: 'neutral',
      filterLogic: () => true
    })
    
    // 4. GENERAR FILTROS POR STATUS DINÁMICAMENTE
    Object.entries(statusCounts)
      .sort(([,a], [,b]) => b - a) // Ordenar por cantidad (mayor a menor)
      .forEach(([status, count]) => {
        if (count === 0) return
        
        const percentage = Math.round((count / total) * 100)
        const rate = (count / total) * 100
        
        // Configuración dinámica por tipo de status
        const statusConfig = getStatusConfig(status, count, total, rate, metrics)
        
        filters.push({
          id: `status_${status}`,
          label: statusConfig.label,
          icon: statusConfig.icon,
          count,
          percentage,
          description: statusConfig.description,
          priority: statusConfig.priority,
          filterLogic: (conv) => (conv.status || 'sin_definir') === status
        })
      })
    
    // 5. GENERAR FILTROS POR POTENCIAL DE VENTAS DINÁMICAMENTE
    Object.entries(salesPotentialCounts)
      .filter(([potential, count]) => count > 0 && potential !== 'no_evaluado')
      .sort(([,a], [,b]) => b - a)
      .forEach(([potential, count]) => {
        const percentage = Math.round((count / total) * 100)
        const potentialConfig = getPotentialConfig(potential, count, total, percentage)
        
        filters.push({
          id: `potential_${potential}`,
          label: potentialConfig.label,
          icon: potentialConfig.icon,
          count,
          percentage,
          description: potentialConfig.description,
          priority: potentialConfig.priority,
          filterLogic: (conv) => conv.salesPotential === potential
        })
      })
    
    console.log('🎯 Filtros generados dinámicamente:', filters.map(f => ({ id: f.id, label: f.label, count: f.count })))
    
    return filters
  }, [conversations, dashboard])

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

    // Aplicar filtro de estado con lógica dinámica
    if (statusFilter !== 'todas') {
      const currentFilter = statusFiltersWithMetrics.find(f => f.id === statusFilter)
      if (currentFilter && currentFilter.filterLogic) {
        filtered = filtered.filter(currentFilter.filterLogic)
      }
    }

    return filtered
  }, [conversations, selectedAIFilters, statusFilter, searchTerm, statusFiltersWithMetrics])

  const handleCopy = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldId)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('Error al copiar:', error)
    }
  }

  const createExportData = () => {
    return {
      conversations: filteredConversations,
      metrics: dashboard?.mainMetrics,
      dynamicMetrics: dashboard?.dynamicMetrics,
      aiInsights: dashboard?.insights
    }
  }

  const handleExportExcel = async () => {
    if (filteredConversations.length === 0) return
    
    try {
      const exportData = createExportData()
      await exportToExcel(exportData, {
        includeAnalysis: true,
        includeMetrics: true
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
          {isCopied ? '✓' : <Copy size={14} />}
        </button>
      </div>
    )
  }

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

        {/* Filtros de estado con métricas */}
        <div className={styles.statusFilters}>
          {statusFiltersWithMetrics.map(filter => (
            <button
              key={filter.id}
              className={`${styles.statusFilterButton} ${styles[filter.id]} ${
                statusFilter === filter.id ? styles.active : ''
              } ${styles[`priority-${filter.priority}`] || ''}`}
              onClick={() => setStatusFilter(filter.id)}
              title={filter.description}
              style={{
                position: 'relative',
                minWidth: '140px',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{filter.icon}</span>
                  <span style={{ fontWeight: '600' }}>{filter.label}</span>
                  <span style={{ 
                    background: 'rgba(0,0,0,0.1)', 
                    padding: '2px 6px', 
                    borderRadius: '10px', 
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    {filter.count}
                  </span>
                </div>
                <div style={{ 
                  fontSize: '10px', 
                  opacity: 0.8, 
                  lineHeight: '1.2',
                  maxWidth: '130px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {filter.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Contador de resultados con contexto de métricas */}
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
        {statusFilter !== 'todas' && (
          <span style={{ color: '#8b5cf6', fontWeight: '500' }}>
            {' '}· {statusFiltersWithMetrics.find(f => f.id === statusFilter)?.percentage}% del total
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
                          {copiedField === `summary-${conv.id}` ? '✓' : <Copy size={14} />}
                        </button>
                      </div>
                    ) : (
                      <div className={styles.generatingMessage}>
                        <span className={styles.generatingIcon}>🤖</span>
                        <span>Analizando y generando resumen...</span>
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
                          {copiedField === `suggestion-${conv.id}` ? '✓' : <Copy size={14} />}
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
          {statusFilter !== 'todas' && ` · Estado: ${statusFiltersWithMetrics.find(b => b.id === statusFilter)?.label}`}
        </div>
      )}
    </div>
  )
}

export default DetailedAnalysisTable 