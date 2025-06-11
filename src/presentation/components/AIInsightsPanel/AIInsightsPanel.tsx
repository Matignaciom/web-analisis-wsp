import React, { useMemo } from 'react'
import type { Conversation } from '@/domain/entities/Conversation'
import styles from './AIInsightsPanel.module.css'

interface AIInsightType {
  id: string
  type: string
  label: string
  icon: string
  count: number
  className: string
  keywords: string[]
}

interface AIInsightsPanelProps {
  conversations: Conversation[]
  selectedFilters: string[]
  onFilterSelect: (filterId: string) => void
  onClearFilters: () => void
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  conversations,
  selectedFilters,
  onFilterSelect,
  onClearFilters
}) => {
  const aiInsights = useMemo(() => {
    const insights: AIInsightType[] = []
    
    // 🎯 ANÁLISIS MEJORADO DE SUGERENCIAS (sin duplicaciones)
    // Clasificar cada conversación en UNA SOLA categoría principal
    const conversationsClassified = conversations.map(conv => {
      // Priorizar por sugerencia IA específica primero
      const suggestion = conv.aiSuggestion?.toLowerCase() || ''
      const interest = conv.interest?.toLowerCase() || ''
      const lastMsg = conv.lastMessage?.toLowerCase() || ''
      
      // 1. Prioridad alta: Oportunidades de venta (alta conversión)
      if (conv.salesPotential === 'high' || 
          suggestion.includes('negocia') || 
          suggestion.includes('oferta') || 
          suggestion.includes('descuento')) {
        return { ...conv, category: 'negotiation' }
      }
      
      // 2. Consultas de precio (específicas)
      if (interest.includes('precio') || 
          interest.includes('costo') || 
          lastMsg.includes('precio') || 
          lastMsg.includes('cuanto')) {
        return { ...conv, category: 'pricing' }
      }
      
      // 3. Seguimiento activo
      if (conv.status === 'active' || 
          suggestion.includes('seguimiento') || 
          suggestion.includes('follow') || 
          suggestion.includes('continuar')) {
        return { ...conv, category: 'followUp' }
      }
      
      // 4. Soporte y problemas
      if (interest.includes('soporte') || 
          interest.includes('ayuda') || 
          interest.includes('problema') || 
          suggestion.includes('soporte')) {
        return { ...conv, category: 'support' }
      }
      
      // 5. Conversación proactiva (pendientes)
      if (conv.status === 'pending' || 
          suggestion.includes('iniciar') || 
          suggestion.includes('proactiv') || 
          suggestion.includes('contactar')) {
        return { ...conv, category: 'proactive' }
      }
      
      // 6. General (resto)
      return { ...conv, category: 'general' }
    })
    
    // Contar cada categoría SIN duplicaciones
    const proactiveCount = conversationsClassified.filter(c => c.category === 'proactive').length
    const followUpCount = conversationsClassified.filter(c => c.category === 'followUp').length
    const pricingCount = conversationsClassified.filter(c => c.category === 'pricing').length
    const supportCount = conversationsClassified.filter(c => c.category === 'support').length
    const negotiationCount = conversationsClassified.filter(c => c.category === 'negotiation').length
    const generalCount = conversationsClassified.filter(c => c.category === 'general').length

    // Solo agregar insights que tengan conversaciones
    if (proactiveCount > 0) {
      insights.push({
        id: 'proactive',
        type: 'proactive',
        label: 'Iniciar conversación proactiva',
        icon: '⭐',
        count: proactiveCount,
        className: 'proactive',
        keywords: ['iniciar', 'proactiv', 'contactar', 'pending']
      })
    }

    if (followUpCount > 0) {
      insights.push({
        id: 'followUp',
        type: 'followUp',
        label: 'Realizar seguimiento',
        icon: '📞',
        count: followUpCount,
        className: 'followUp',
        keywords: ['seguimiento', 'follow', 'continuar', 'active']
      })
    }

    if (pricingCount > 0) {
      insights.push({
        id: 'pricing',
        type: 'pricing',
        label: 'Consultas de precios',
        icon: '💰',
        count: pricingCount,
        className: 'pricing',
        keywords: ['precio', 'costo', 'cuanto']
      })
    }

    if (supportCount > 0) {
      insights.push({
        id: 'support',
        type: 'support',
        label: 'Soporte y ayuda',
        icon: '🛠️',
        count: supportCount,
        className: 'support',
        keywords: ['soporte', 'ayuda', 'problema']
      })
    }

    if (negotiationCount > 0) {
      insights.push({
        id: 'negotiation',
        type: 'negotiation',
        label: 'Oportunidades de venta',
        icon: '🎯',
        count: negotiationCount,
        className: 'negotiation',
        keywords: ['negocia', 'oferta', 'descuento', 'high']
      })
    }

    if (generalCount > 0) {
      insights.push({
        id: 'general',
        type: 'general',
        label: 'Información general',
        icon: '📋',
        count: generalCount,
        className: 'general',
        keywords: ['general', 'información']
      })
    }

    return insights
  }, [conversations])

  const handleInsightClick = (insightId: string) => {
    onFilterSelect(insightId)
  }

  const handleRemoveFilter = (filterId: string) => {
    onFilterSelect(filterId) // Toggle off
  }

  const getFilterDisplayName = (filterId: string): string => {
    const insight = aiInsights.find(i => i.id === filterId)
    return insight ? insight.label : filterId
  }

  const totalConversations = conversations.length
  const filteredConversations = selectedFilters.length > 0 
    ? conversations.filter(conv => {
        return selectedFilters.some(filterId => {
          const insight = aiInsights.find(i => i.id === filterId)
          if (!insight) return false
          
          return insight.keywords.some(keyword => {
            return conv.aiSuggestion?.toLowerCase().includes(keyword) ||
                   conv.interest?.toLowerCase().includes(keyword) ||
                   conv.lastMessage?.toLowerCase().includes(keyword) ||
                   conv.status === keyword ||
                   conv.salesPotential === keyword
          })
        })
      })
    : conversations

  if (aiInsights.length === 0) {
    return (
      <div className={styles.aiInsightsPanel}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>🤖 Resumen de Sugerencias IA</h3>
        </div>
        <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
          <p>No hay sugerencias disponibles aún.</p>
          <p style={{ fontSize: '14px' }}>Las sugerencias aparecerán cuando se complete el análisis IA.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.aiInsightsPanel}>
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>🤖 Resumen de Sugerencias IA</h3>
      </div>

      {/* Grid de insights */}
      <div className={styles.insightsGrid}>
        {aiInsights.map(insight => (
          <div
            key={insight.id}
            className={`${styles.insightCard} ${styles[insight.className]} ${
              selectedFilters.includes(insight.id) ? styles.selected : ''
            }`}
            onClick={() => handleInsightClick(insight.id)}
          >
            <div className={styles.insightHeader}>
              <div className={styles.insightType}>
                <span className={styles.insightIcon}>{insight.icon}</span>
                {insight.label}
              </div>
              <div className={styles.insightCount}>
                {insight.count}
              </div>
            </div>
            <div className={styles.insightLabel}>
              {insight.count === 1 ? 'conversación' : 'conversaciones'}
            </div>
          </div>
        ))}
      </div>

      {/* Filtros activos */}
      <div className={styles.activeFilters}>
        {selectedFilters.length > 0 ? (
          <>
            {selectedFilters.map(filterId => (
              <div key={filterId} className={styles.filterChip}>
                <span className={styles.filterText}>
                  {getFilterDisplayName(filterId)}
                </span>
                <button
                  className={styles.removeFilter}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveFilter(filterId)
                  }}
                  title="Quitar filtro"
                >
                  ×
                </button>
              </div>
            ))}
            {selectedFilters.length > 0 && (
              <button
                className={styles.clearAllFilters}
                onClick={onClearFilters}
                title="Limpiar filtro"
              >
                Limpiar filtro
              </button>
            )}
          </>
        ) : (
          <div className={styles.emptyFilters}>
            Haz clic en una tarjeta para filtrar conversaciones por tipo de sugerencia
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className={styles.statsText}>
        {selectedFilters.length > 0 
          ? `Mostrando ${filteredConversations.length} de ${totalConversations} conversaciones`
          : `${totalConversations} conversaciones analizadas`
        }
      </div>
    </div>
  )
}

export default AIInsightsPanel 