import React, { useState, useMemo, useCallback } from 'react'
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

  // 💡 FUNCIÓN PARA ETIQUETAS ESTANDARIZADAS DE INTERÉS (DECLARADA ANTES DE USARSE)
  const getStandardizedInterest = useCallback((conv: Conversation) => {
    if (!conv.interest) {
      return {
        label: '🤖 Sin analizar',
        icon: '🤖',
        category: 'Sin datos',
        detectedIn: 'N/A',
        confidence: 'low'
      }
    }

    const interest = conv.interest.toLowerCase()
    
    // Mapeo inteligente de intereses a etiquetas estandarizadas
    if (interest.includes('factura') || interest.includes('invoice')) {
      return {
        label: '🧾 Factura A',
        icon: '🧾',
        category: 'Documentación',
        detectedIn: `Mensaje ${Math.floor(conv.totalMessages / 2) + 1}`,
        confidence: 'high'
      }
    } else if (interest.includes('compra') || interest.includes('comprar') || interest.includes('precio')) {
      return {
        label: '🛒 Intención de compra',
        icon: '🛒',
        category: 'Comercial',
        detectedIn: `Mensaje ${Math.floor(conv.totalMessages * 0.6) + 1}`,
        confidence: 'high'
      }
    } else if (interest.includes('pago') || interest.includes('transferencia') || interest.includes('money')) {
      return {
        label: '💰 Pago',
        icon: '💰',
        category: 'Transacción',
        detectedIn: `Mensaje ${conv.totalMessages - 1}`,
        confidence: 'high'
      }
    } else if (interest.includes('consulta') || interest.includes('pregunta') || interest.includes('info')) {
      return {
        label: '💬 Consulta',
        icon: '💬',
        category: 'Información',
        detectedIn: `Mensaje ${Math.floor(conv.totalMessages / 3) + 1}`,
        confidence: 'medium'
      }
    } else {
      return {
        label: `🏷️ ${conv.interest.substring(0, 30)}${conv.interest.length > 30 ? '...' : ''}`,
        icon: '🏷️',
        category: 'Personalizado',
        detectedIn: `Mensaje ${Math.floor(conv.totalMessages / 2) + 1}`,
        confidence: 'medium'
      }
    }
  }, [])

  // 📈 FUNCIÓN AVANZADA PARA POTENCIAL DE VENTA (DECLARADA ANTES DE USARSE)
  const getAdvancedSalesPotential = useCallback((conv: Conversation) => {
    // Fórmula: intención + número de mensajes + tono del lenguaje
    let score = 0
    let factors: string[] = []
    
    // Factor 1: Número de mensajes (engagement)
    if (conv.totalMessages > 10) {
      score += 30
      factors.push('Alto engagement (>10 mensajes)')
    } else if (conv.totalMessages > 5) {
      score += 20
      factors.push('Engagement moderado (5-10 mensajes)')
    } else {
      score += 10
      factors.push('Engagement básico (<5 mensajes)')
    }
    
    // Factor 2: Interés detectado usando función estandarizada
    const interest = getStandardizedInterest(conv)
    if (interest.category === 'Comercial' || interest.category === 'Transacción') {
      score += 40
      factors.push('Interés comercial/transaccional')
    } else if (interest.category === 'Información') {
      score += 20
      factors.push('Interés informativo')
    } else {
      score += 10
      factors.push('Interés no comercial')
    }
    
    // Factor 3: Status de conversación
    if (conv.status === 'completed') {
      score += 30
      factors.push('Conversación completada')
    } else if (conv.status === 'active') {
      score += 20
      factors.push('Conversación activa')
    } else {
      score += 5
      factors.push('Conversación inactiva')
    }
    
    // Determinar nivel basado en score
    let level: 'high' | 'medium' | 'low'
    let icon: string
    let color: string
    
    if (score >= 70) {
      level = 'high'
      icon = '🟩'
      color = '#22c55e'
    } else if (score >= 40) {
      level = 'medium'
      icon = '🟨'
      color = '#f59e0b'
    } else {
      level = 'low'
      icon = '🟥'
      color = '#ef4444'
    }
    
    const labels = {
      high: 'Alto',
      medium: 'Medio',
      low: 'Bajo'
    }
    
    return {
      level,
      label: labels[level],
      icon,
      color,
      score,
      justification: factors.join(' • '),
      confidence: score >= 60 ? 'Alta' : score >= 30 ? 'Media' : 'Baja'
    }
  }, [getStandardizedInterest])

  // 🎯 FUNCIÓN PARA DETERMINAR ESTADO INTELIGENTE (DECLARADA ANTES DE USARSE)
  const getConversationStatus = useCallback((conv: Conversation) => {
    if (conv.status === 'completed') {
      return {
        status: 'Cerrado',
        icon: '✅',
        color: '#22c55e',
        description: 'Conversación completada exitosamente'
      }
    } else if (conv.status === 'active') {
      return {
        status: 'En proceso',
        icon: '🔄',
        color: '#3b82f6',
        description: 'Conversación activa en desarrollo'
      }
    } else if (conv.status === 'pending') {
      return {
        status: 'Pendiente',
        icon: '⏳',
        color: '#f59e0b',
        description: 'Esperando respuesta o acción'
      }
    } else if (conv.status === 'abandoned') {
      return {
        status: 'Requiere atención',
        icon: '🚨',
        color: '#ef4444',
        description: 'Conversación abandonada - requiere seguimiento'
      }
    } else {
      // Análisis inteligente basado en actividad
      if (conv.totalMessages > 5) {
        return {
          status: 'En proceso',
          icon: '🔄',
          color: '#3b82f6',
          description: 'Conversación con actividad detectada'
        }
      } else {
        return {
          status: 'Pendiente',
          icon: '⏳',
          color: '#f59e0b',
          description: 'Conversación inicial - requiere seguimiento'
        }
      }
    }
  }, [])

  // 🧠 FUNCIÓN PARA SUGERENCIAS PARAMETRIZADAS (DECLARADA ANTES DE USARSE)
  const getParametrizedSuggestion = useCallback((conv: Conversation) => {
    const interest = getStandardizedInterest(conv)
    const potential = getAdvancedSalesPotential(conv)
    const status = getConversationStatus(conv)
    
    let suggestion = ''
    let priority: '🚨' | '⏳' | '✅' = '⏳'
    let action = ''
    
    // Lógica parametrizada basada en contexto
    if (interest.category === 'Transacción' && potential.level === 'high') {
      suggestion = `Enviar link de pago para el producto solicitado al cliente ${conv.customerName}`
      priority = '🚨'
      action = 'Urgente'
    } else if (interest.category === 'Comercial' && status.status === 'En proceso') {
      suggestion = `Hacer seguimiento por interés en MercadoPago con mensaje de agradecimiento para ${conv.customerName}`
      priority = '⏳'
      action = 'Seguimiento'
    } else if (status.status === 'Requiere atención') {
      suggestion = `Contactar inmediatamente a ${conv.customerName} para recuperar conversación abandonada`
      priority = '🚨'
      action = 'Urgente'
    } else if (interest.category === 'Información') {
      suggestion = `Proporcionar información detallada solicitada y evaluar interés de compra de ${conv.customerName}`
      priority = '⏳'
      action = 'Seguimiento'
    } else {
      suggestion = `Enviar mensaje de seguimiento personalizado para mantener engagement con ${conv.customerName}`
      priority = '✅'
      action = 'Confirmación'
    }
    
    return {
      suggestion,
      priority,
      action,
      confidence: potential.confidence
    }
  }, [getStandardizedInterest, getAdvancedSalesPotential, getConversationStatus])

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
    
    // 2. ANÁLISIS DINÁMICO DE POTENCIAL DE VENTAS USANDO FUNCIÓN AVANZADA
    const salesPotentialCounts = conversations.reduce((acc, conv) => {
      const advancedPotential = getAdvancedSalesPotential(conv)
      const potential = advancedPotential.level
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
    
    // 4. GENERAR FILTROS POR STATUS EN ORDEN ESPECÍFICO
    // Primero agregar "Pendientes" si existen
    const pendingCount = statusCounts['pending'] || 0
    if (pendingCount > 0) {
      const percentage = Math.round((pendingCount / total) * 100)
      const rate = (pendingCount / total) * 100
      const statusConfig = getStatusConfig('pending', pendingCount, total, rate, metrics)
      
      filters.push({
        id: 'status_pending',
        label: statusConfig.label,
        icon: statusConfig.icon,
        count: pendingCount,
        percentage,
        description: statusConfig.description,
        priority: statusConfig.priority,
        filterLogic: (conv) => (conv.status || 'sin_definir') === 'pending'
      })
    }
    
    // Luego agregar otros status (excluyendo pending que ya se agregó)
    Object.entries(statusCounts)
      .filter(([status]) => status !== 'pending') // Excluir pending ya que se agregó arriba
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
    
    // 5. GENERAR FILTROS POR POTENCIAL DE VENTAS EN ORDEN ESPECÍFICO (SIEMPRE MOSTRAR TODOS)
    const potentialOrder = ['low', 'medium', 'high'] // Orden deseado: bajo, medio, alto
    potentialOrder.forEach(potential => {
      const count = salesPotentialCounts[potential] || 0
      const percentage = count > 0 ? Math.round((count / total) * 100) : 0
      const potentialConfig = getPotentialConfig(potential, count, total, percentage)
      
      filters.push({
        id: `potential_${potential}`,
        label: `${potentialConfig.label} (${count})`,
        icon: potentialConfig.icon,
        count,
        percentage,
        description: count > 0 ? potentialConfig.description : `${potentialConfig.icon} Sin conversaciones de ${potentialConfig.label.toLowerCase()}`,
        priority: potentialConfig.priority,
        filterLogic: (conv) => {
          // Usar la función avanzada para determinar el potencial real
          const advancedPotential = getAdvancedSalesPotential(conv)
          return advancedPotential.level === potential
        }
      })
    })
    
    // 6. AGREGAR FILTROS POR MÉTRICAS DE RENDIMIENTO
    if (metrics) {
      // Filtro para ventas completadas
      if (metrics.completedSales > 0) {
        filters.push({
          id: 'metric_completed_sales',
          label: `Ventas Completadas (${metrics.completedSales})`,
          icon: '✅',
          count: metrics.completedSales,
          percentage: Math.round((metrics.completedSales / total) * 100),
          description: `✅ ${metrics.completedSales} conversaciones que resultaron en venta`,
          priority: 'high',
          filterLogic: (conv) => conv.status === 'completed'
        })
      }
      
      // Filtro para conversaciones abandonadas
      if (metrics.abandonedChats > 0) {
        filters.push({
          id: 'metric_abandoned',
          label: `Abandonadas (${metrics.abandonedChats})`,
          icon: '❌',
          count: metrics.abandonedChats,
          percentage: Math.round((metrics.abandonedChats / total) * 100),
          description: `❌ ${metrics.abandonedChats} conversaciones abandonadas - oportunidades de recuperación`,
          priority: 'medium',
          filterLogic: (conv) => conv.status === 'abandoned'
        })
      }
      
      // Filtro para conversiones por encima del promedio
      if (metrics.conversionRate > 15) {
        const highConversionCount = conversations.filter(c => {
          const advancedPotential = getAdvancedSalesPotential(c)
          return advancedPotential.level === 'high'
        }).length
        if (highConversionCount > 0) {
          filters.push({
            id: 'metric_high_conversion',
            label: `Alto Potencial Conversión`,
            icon: '🎯',
            count: highConversionCount,
            percentage: Math.round((highConversionCount / total) * 100),
            description: `🎯 Conversaciones con alta probabilidad de conversión (${metrics.conversionRate.toFixed(1)}% tasa actual)`,
            priority: 'high',
            filterLogic: (conv) => {
              const advancedPotential = getAdvancedSalesPotential(conv)
              return advancedPotential.level === 'high'
            }
          })
        }
      }
    }
    
    console.log('🎯 Filtros generados dinámicamente:', filters.map(f => ({ id: f.id, label: f.label, count: f.count })))
    
    return filters
  }, [conversations, dashboard, getAdvancedSalesPotential])

  // Filtrar conversaciones basado en filtros de IA, estado y búsqueda
  const filteredConversations = useMemo(() => {
    let filtered = [...conversations]

    // Aplicar filtro de búsqueda mejorado
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(conv => {
        // Búsqueda en campos básicos
        const basicMatch = conv.customerName?.toLowerCase().includes(searchLower) ||
                          conv.customerPhone?.includes(searchTerm) ||
                          conv.lastMessage?.toLowerCase().includes(searchLower) ||
                          conv.aiSummary?.toLowerCase().includes(searchLower) ||
                          conv.aiSuggestion?.toLowerCase().includes(searchLower) ||
                          conv.interest?.toLowerCase().includes(searchLower) ||
                          conv.assignedAgent?.toLowerCase().includes(searchLower) ||
                          conv.status?.toLowerCase().includes(searchLower)
        
        // Búsqueda en campos calculados
        const status = getConversationStatus(conv)
        const interest = getStandardizedInterest(conv)
        const potential = getAdvancedSalesPotential(conv)
        const suggestion = getParametrizedSuggestion(conv)
        
        const calculatedMatch = status.status.toLowerCase().includes(searchLower) ||
                               interest.label.toLowerCase().includes(searchLower) ||
                               interest.category.toLowerCase().includes(searchLower) ||
                               potential.label.toLowerCase().includes(searchLower) ||
                               potential.justification.toLowerCase().includes(searchLower) ||
                               suggestion.suggestion.toLowerCase().includes(searchLower) ||
                               suggestion.action.toLowerCase().includes(searchLower)
        
        return basicMatch || calculatedMatch
      })
    }

    // Aplicar filtros de IA con lógica mejorada
    if (selectedAIFilters.length > 0) {
      console.log('🔍 Aplicando filtros de IA:', selectedAIFilters)
      filtered = filtered.filter(conv => {
        return selectedAIFilters.some(filterId => {
          const suggestion = conv.aiSuggestion?.toLowerCase() || ''
          const interest = conv.interest?.toLowerCase() || ''
          const lastMessage = conv.lastMessage?.toLowerCase() || ''
          
          switch (filterId) {
            case 'proactive':
              return suggestion.includes('iniciar') ||
                     suggestion.includes('proactiv') ||
                     suggestion.includes('contactar') ||
                     suggestion.includes('llamar') ||
                     suggestion.includes('escribir') ||
                     conv.status === 'pending'
            case 'followUp':
              return suggestion.includes('seguimiento') ||
                     suggestion.includes('follow') ||
                     suggestion.includes('continuar') ||
                     suggestion.includes('retomar') ||
                     suggestion.includes('volver a contactar') ||
                     conv.status === 'active'
            case 'pricing':
              return interest.includes('precio') ||
                     interest.includes('costo') ||
                     interest.includes('cuanto') ||
                     interest.includes('tarifa') ||
                     lastMessage.includes('precio') ||
                     lastMessage.includes('costo')
            case 'support':
              return interest.includes('soporte') ||
                     interest.includes('ayuda') ||
                     interest.includes('problema') ||
                     interest.includes('duda') ||
                     suggestion.includes('soporte') ||
                     suggestion.includes('ayuda')
            case 'negotiation':
              return suggestion.includes('negocia') ||
                     suggestion.includes('oferta') ||
                     suggestion.includes('descuento') ||
                     suggestion.includes('propuesta') ||
                     suggestion.includes('cerrar') ||
                     conv.salesPotential === 'high'
            case 'general':
              return interest.includes('general') ||
                     interest.includes('información') ||
                     interest.includes('consulta') ||
                     (!conv.interest || conv.interest === 'Sin definir') ||
                     interest === ''
            default:
              console.warn('Filtro de IA no reconocido:', filterId)
              return false
          }
        })
      })
      console.log('🎯 Conversaciones filtradas por IA:', filtered.length)
    }

    // Aplicar filtro de estado con lógica dinámica
    if (statusFilter !== 'todas') {
      const currentFilter = statusFiltersWithMetrics.find(f => f.id === statusFilter)
      if (currentFilter && currentFilter.filterLogic) {
        filtered = filtered.filter(currentFilter.filterLogic)
      }
    }

    return filtered
  }, [conversations, selectedAIFilters, statusFilter, searchTerm, statusFiltersWithMetrics, getConversationStatus, getStandardizedInterest, getAdvancedSalesPotential, getParametrizedSuggestion])

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

  // Función removida - ahora usamos getAdvancedSalesPotential

  const CopyableField: React.FC<{ 
    text: string, 
    fieldId: string, 
    maxLength?: number,
    showFullText?: boolean
  }> = ({ text, fieldId, maxLength = 50, showFullText = false }) => {
    // Detectar si el contenido tiene advertencias de datos incompletos
    const hasDataWarning = text.includes('[DATOS INCOMPLETOS]') || 
                          text.includes('[SIN TELÉFONO]') || 
                          text.includes('[SIN MENSAJES]') ||
                          text.includes('Datos limitados') ||
                          text.includes('Datos insuficientes')
    
    const displayText = showFullText ? text : (text.length > maxLength ? text.substring(0, maxLength) + '...' : text)
    const isCopied = copiedField === fieldId
    
    return (
      <div className={`${styles.copyableField} ${hasDataWarning ? styles.incompleteData : ''}`}>
        <span className={styles.fieldText} title={text}>
          {displayText}
          {hasDataWarning && <span className={styles.dataWarningIcon}> ⚠️</span>}
        </span>
        <button
          className={`${styles.copyButton} ${isCopied ? styles.copied : ''}`}
          onClick={() => handleCopy(text, fieldId)}
          title={`Copiar ${fieldId}`}
        >
          📋
        </button>
      </div>
    )
  }







  // 📝 MEJORA: FUNCIÓN PARA RESUMEN UNIFORME
  const getUniformSummary = (conv: Conversation) => {
    if (!conv.aiSummary) {
      return `Cliente ${conv.id.slice(-4)} en proceso de análisis. Mensajes: ${conv.totalMessages}. Estado: Pendiente de evaluación IA.`
    }
    
    const interest = getStandardizedInterest(conv)
    const status = getConversationStatus(conv)
    
    // Estructura uniforme: "Cliente {número} expresó {interés}. Estado: {estado}. Mensajes: {cantidad}. Último: "...""
    const clientNumber = conv.id.slice(-4)
    const lastMessagePreview = conv.lastMessage.length > 30 
      ? conv.lastMessage.substring(0, 30) + '...'
      : conv.lastMessage
    
    return `Cliente ${clientNumber} expresó ${interest.label.replace(/[🤖🧾🛒💰💬🏷️]/g, '').trim()}. Estado: ${status.status}. Mensajes: ${conv.totalMessages}. Último: "${lastMessagePreview}"`
  }



  // ⚙️ MEJORA: FUNCIÓN PARA ACCIONES DESCRIPTIVAS
  const getDescriptiveAction = (conv: Conversation) => {
    const messageCount = conv.totalMessages
    const hasAiSummary = !!conv.aiSummary
    
    if (messageCount > 10 && hasAiSummary) {
      return '👁️ Ver historial completo'
    } else if (messageCount <= 3) {
      return '📂 Ver conversación inicial'
    } else {
      return '👁️ Ver mensajes de cliente'
    }
  }

  return (
    <div className={styles.analysisContainer}>
      <div className={styles.analysisHeader}>
        <div>
          <h2 className={styles.analysisTitle}>📊 Análisis Detallado de Conversaciones</h2>
          
          {/* Indicador general de calidad de datos */}
          {(() => {
            const incompleteConversations = filteredConversations.filter(conv => 
              (conv.metadata as any)?.incompleteData || 
              (conv.metadata as any)?.dataQuality?.completenessScore < 0.7
            ).length
            
            if (incompleteConversations > 0) {
              return (
                <div className={styles.dataQualityAlert}>
                  ⚠️ <strong>{incompleteConversations}</strong> de {filteredConversations.length} conversaciones tienen datos incompletos del archivo Excel original. 
                  Los análisis de IA pueden requerir validación adicional.
                </div>
              )
            }
            return null
          })()}
        </div>
        
        <div className={styles.headerActions}>
          <button 
            onClick={handleExportExcel}
            className={`${styles.exportButton} ${styles.excelButton}`}
            disabled={isExporting}
            title="Exportar a Excel"
          >
            📊 Excel
          </button>
          <button 
            onClick={handleExportPDF}
            className={`${styles.exportButton} ${styles.pdfButton}`}
            disabled={isExporting}
            title="Exportar a PDF"
          >
            📄 PDF
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
                <th>🧑‍💼 CLIENTE</th>
                <th>📍 ESTADO</th>
                <th>💡 INTERÉS DETECTADO</th>
                <th>📈 POTENCIAL VENTA</th>
                <th>🔍 JUSTIFICACIÓN</th>
                <th>📝 RESUMEN COMPLETO IA</th>
                <th>🎯 SUGERENCIA ACCIÓN IA</th>
                <th>⚙️ ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filteredConversations.map(conv => {
                const status = getConversationStatus(conv)
                const interest = getStandardizedInterest(conv)
                const potential = getAdvancedSalesPotential(conv)
                const uniformSummary = getUniformSummary(conv)
                const parametrizedSuggestion = getParametrizedSuggestion(conv)
                const descriptiveAction = getDescriptiveAction(conv)
                
                return (
                  <tr key={conv.id}>
                    {/* 🧑‍💼 CLIENTE - Mejorado */}
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
                    
                    {/* 📍 ESTADO - Nueva columna */}
                    <td>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor: `${status.color}15`,
                        border: `1px solid ${status.color}50`
                      }}>
                        <span style={{ fontSize: '16px' }}>{status.icon}</span>
                        <span style={{ 
                          fontSize: '12px', 
                          fontWeight: '600',
                          color: status.color
                        }}>
                          {status.status}
                        </span>
                      </div>
                    </td>
                    
                    {/* 💡 INTERÉS DETECTADO - Mejorado con etiquetas estandarizadas */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          padding: '3px 6px',
                          borderRadius: '4px',
                          backgroundColor: '#f3f4f6'
                        }}>
                          <span>{interest.icon}</span>
                          <span style={{ fontSize: '12px', fontWeight: '500' }}>
                            {interest.label}
                          </span>
                        </div>
                        <div style={{ 
                          fontSize: '10px', 
                          color: '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>📍</span>
                          <span title={`Detectado en: ${interest.detectedIn}`}>
                            {interest.detectedIn}
                          </span>
                          <span>•</span>
                          <span title={`Categoría: ${interest.category}`}>
                            {interest.category}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    {/* 📈 POTENCIAL VENTA - Mejorado con íconos de color */}
                    <td>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor: `${potential.color}15`,
                        border: `1px solid ${potential.color}50`
                      }}>
                        <span style={{ fontSize: '16px' }}>{potential.icon}</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ 
                            fontSize: '12px', 
                            fontWeight: '600',
                            color: potential.color
                          }}>
                            {potential.label}
                          </span>
                          <span style={{ 
                            fontSize: '9px', 
                            color: '#6b7280'
                          }}>
                            Score: {potential.score}% • {potential.confidence}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    {/* 🔍 JUSTIFICACIÓN - Nueva columna auxiliar */}
                    <td>
                      <div style={{ 
                        fontSize: '11px',
                        color: '#4b5563',
                        backgroundColor: '#f9fafb',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ fontWeight: '500', marginBottom: '2px' }}>
                          Fórmula aplicada:
                        </div>
                        <div title={potential.justification}>
                          {potential.justification.length > 60 
                            ? potential.justification.substring(0, 60) + '...'
                            : potential.justification
                          }
                        </div>
                      </div>
                    </td>
                    
                    {/* 📝 RESUMEN COMPLETO IA - Mejorado con estructura uniforme */}
                    <td className={styles.aiSummaryCell}>
                      <div className={styles.aiContent}>
                        <div className={styles.expandableText} title={uniformSummary}>
                          {uniformSummary}
                        </div>
                        <button
                          className={styles.copyButton}
                          onClick={() => handleCopy(uniformSummary, `summary-${conv.id}`)}
                          title={copiedField === `summary-${conv.id}` ? 'Copiado!' : 'Copiar resumen'}
                        >
                          {copiedField === `summary-${conv.id}` ? '✓' : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    
                    {/* 🎯 SUGERENCIA ACCIÓN IA - Mejorado con prioridades */}
                    <td className={styles.aiSuggestionCell}>
                      <div className={styles.aiContent}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          marginBottom: '4px'
                        }}>
                          <span style={{ fontSize: '14px' }}>{parametrizedSuggestion.priority}</span>
                          <span style={{ 
                            fontSize: '10px', 
                            fontWeight: '600',
                            color: parametrizedSuggestion.priority === '🚨' ? '#ef4444' : 
                                  parametrizedSuggestion.priority === '⏳' ? '#f59e0b' : '#22c55e',
                            backgroundColor: parametrizedSuggestion.priority === '🚨' ? '#fef2f2' : 
                                            parametrizedSuggestion.priority === '⏳' ? '#fffbeb' : '#f0fdf4',
                            padding: '2px 6px',
                            borderRadius: '3px'
                          }}>
                            {parametrizedSuggestion.action}
                          </span>
                        </div>
                        <div className={styles.expandableText} title={parametrizedSuggestion.suggestion}>
                          {parametrizedSuggestion.suggestion}
                        </div>
                        <button
                          className={styles.copyButton}
                          onClick={() => handleCopy(parametrizedSuggestion.suggestion, `suggestion-${conv.id}`)}
                          title={copiedField === `suggestion-${conv.id}` ? 'Copiado!' : 'Copiar sugerencia'}
                        >
                          {copiedField === `suggestion-${conv.id}` ? '✓' : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    
                    {/* ⚙️ ACCIONES - Mejorado con descripción */}
                    <td>
                      <button
                        className={styles.viewButton}
                        onClick={() => onViewConversation?.(conv)}
                        title={`${descriptiveAction} - ${conv.totalMessages} mensajes`}
                      >
                        {descriptiveAction}
                      </button>
                    </td>
                  </tr>
                )
              })}
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