import React, { useState, useMemo, useCallback } from 'react'
import { Copy } from 'lucide-react'
import type { Conversation } from '@/domain/entities/Conversation'
import { ConversationStatus } from '@/domain/entities/Conversation'
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

  // 🔍 FUNCIÓN PARA DETECTAR VENTAS COMPLETADAS (MISMA LÓGICA QUE MÉTRICAS)
  const isCompletedSale = useCallback((conv: Conversation): boolean => {
    // 1. Verificar status explícitos de venta (misma lógica que DynamicMetricsService)
    const salesStatuses = ['completed', 'completado', 'finalizado', 'vendido', 'venta', 'exitoso', 'won', 'closed-won']
    if (salesStatuses.includes(conv.status.toLowerCase())) {
      return true
    }
    
    // 2. Detectar indicadores de venta en mensajes
    const lastMsg = conv.lastMessage?.toLowerCase() || ''
    const salesKeywords = ['compra', 'comprar', 'venta', 'vendido', 'pago', 'transferencia', 'factura', 'entrega', 'envío']
    if (salesKeywords.some(keyword => lastMsg.includes(keyword))) {
      return true
    }
    
    // 3. Detectar por alto número de mensajes con alta satisfacción
    if (conv.totalMessages > 10 && conv.metadata?.satisfaction && conv.metadata.satisfaction >= 4) {
      return true
    }
    
    return false
  }, [])

  // 🔍 FUNCIÓN PARA DETECTAR CONVERSACIONES ABANDONADAS (MISMA LÓGICA QUE MÉTRICAS)
  const isAbandonedConversation = useCallback((conv: Conversation): boolean => {
    // 1. Verificar status explícitos de abandono
    const abandonedStatuses = ['abandoned', 'abandonado', 'perdido', 'cancelado', 'rechazado', 'lost', 'closed-lost']
    if (abandonedStatuses.includes(conv.status.toLowerCase())) {
      return true
    }
    
    // 2. Detectar indicadores de abandono en mensajes
    const lastMsg = conv.lastMessage?.toLowerCase() || ''
    const abandonKeywords = ['no me interesa', 'muy caro', 'no gracias', 'después', 'cancelar', 'rechazar']
    if (abandonKeywords.some(keyword => lastMsg.includes(keyword))) {
      return true
    }
    
    // 3. Detectar abandono por baja actividad
    if (conv.totalMessages <= 2 && conv.metadata?.satisfaction && conv.metadata.satisfaction <= 2) {
      return true
    }
    
    // 4. Detectar abandono por falta de respuesta reciente
    const daysSinceStart = conv.startDate ? 
      Math.floor((Date.now() - conv.startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
    if (daysSinceStart > 7 && conv.totalMessages <= 3) {
      return true
    }
    
    return false
  }, [])

  // 💡 FUNCIÓN PARA ETIQUETAS ESTANDARIZADAS DE INTERÉS (DECLARADA ANTES DE USARSE)
  const getStandardizedInterest = useCallback((conv: Conversation) => {
    if (!conv.interest) {
      return {
        label: 'Sin analizar',
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
        label: 'Factura A',
        icon: '🧾',
        category: 'Documentación',
        detectedIn: `Mensaje ${Math.floor(conv.totalMessages / 2) + 1}`,
        confidence: 'high'
      }
    } else if (interest.includes('compra') || interest.includes('comprar') || interest.includes('precio')) {
      return {
        label: 'Intención de compra',
        icon: '🛒',
        category: 'Comercial',
        detectedIn: `Mensaje ${Math.floor(conv.totalMessages * 0.6) + 1}`,
        confidence: 'high'
      }
    } else if (interest.includes('pago') || interest.includes('transferencia') || interest.includes('money')) {
      return {
        label: 'Pago',
        icon: '💰',
        category: 'Transacción',
        detectedIn: `Mensaje ${conv.totalMessages - 1}`,
        confidence: 'high'
      }
    } else if (interest.includes('consulta') || interest.includes('pregunta') || interest.includes('info')) {
      return {
        label: 'Consulta',
        icon: '💬',
        category: 'Información',
        detectedIn: `Mensaje ${Math.floor(conv.totalMessages / 3) + 1}`,
        confidence: 'medium'
      }
    } else {
      return {
        label: `${conv.interest.substring(0, 30)}${conv.interest.length > 30 ? '...' : ''}`,
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

  // 🎯 FUNCIÓN PARA DETERMINAR ESTADO INTELIGENTE AVANZADO (SINCRONIZADA CON MÉTRICAS)
  const getConversationStatus = useCallback((conv: Conversation) => {
    // Usar la MISMA lógica avanzada que las métricas para detectar estados reales
    
    // 1. Verificar si es venta completada usando lógica avanzada
    if (isCompletedSale(conv)) {
      return {
        status: 'Completada',
        icon: '✅',
        color: '#22c55e',
        description: 'Venta completada exitosamente'
      }
    }
    
    // 2. Verificar si está abandonada usando lógica avanzada  
    if (isAbandonedConversation(conv)) {
      return {
        status: 'Requiere atención',
        icon: '🚨',
        color: '#ef4444',
        description: 'Conversación abandonada - requiere seguimiento'
      }
    }
    
    // 3. Verificar estados explícitos restantes
    if (conv.status === ConversationStatus.ACTIVE || conv.status.toLowerCase() === 'activo') {
      return {
        status: 'En proceso',
        icon: '🔄',
        color: '#3b82f6',
        description: 'Conversación activa en desarrollo'
      }
    }
    
    // 4. Análisis inteligente basado en actividad para estados ambiguos
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
  }, [isCompletedSale, isAbandonedConversation])

  // 🎯 FUNCIÓN PARA SUGERENCIAS PARAMETRIZADAS MEJORADAS
  const getParametrizedSuggestion = useCallback((conv: Conversation) => {
    const status = getConversationStatus(conv)
    const interest = getStandardizedInterest(conv)
    const potential = getAdvancedSalesPotential(conv)
    
    let suggestion: string
    let priority: string
    let action: string
    
    if (potential.level === 'high') {
      suggestion = `🎯 OPORTUNIDAD: ${conv.customerName} muestra alto potencial. Contactar inmediatamente para cerrar venta`
      priority = '🚀'
      action = 'Venta'
    } else if (interest.category === 'Comercial') {
      suggestion = `💰 COMERCIAL: ${conv.customerName} tiene interés de compra. Enviar propuesta personalizada`
      priority = '🎯'
      action = 'Propuesta'
    } else if (interest.label.includes('precio') || interest.label.includes('Precio')) {
      suggestion = `💲 PRECIO: ${conv.customerName} pregunta precios. Enviar cotización detallada y beneficios`
      priority = '📊'
      action = 'Cotización'
    } else if (interest.category === 'Transacción') {
      suggestion = `💳 PAGO: ${conv.customerName} consulta sobre pagos. Explicar métodos y facilitar proceso`
      priority = '⏳'
      action = 'Facilitar'
    } else if (status.status === 'Requiere atención') {
      suggestion = `🚨 URGENTE: ${conv.customerName} abandonó la conversación. Recuperar contacto inmediatamente`
      priority = '🚨'
      action = 'Recuperar'
    } else if (interest.category === 'Información') {
      suggestion = `📋 INFO: ${conv.customerName} busca información. Enviar detalles completos y evaluar interés`
      priority = '📞'
      action = 'Informar'
    } else if (conv.totalMessages <= 1) {
      suggestion = `🔰 NUEVO: ${conv.customerName} inició contacto. Dar bienvenida y conocer sus necesidades`
      priority = '👋'
      action = 'Bienvenida'
    } else {
      suggestion = `📞 SEGUIMIENTO: ${conv.customerName} necesita atención personalizada. Hacer seguimiento activo`
      priority = '✅'
      action = 'Seguimiento'
    }
    
    return {
      suggestion,
      priority,
      action,
      confidence: potential.confidence
    }
  }, [getStandardizedInterest, getAdvancedSalesPotential, getConversationStatus])


  
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
    
    // 1. ANÁLISIS DINÁMICO DE STATUS REALES USANDO LÓGICA AVANZADA
    const statusCounts = conversations.reduce((acc, conv) => {
      const statusInfo = getConversationStatus(conv)
      const statusKey = statusInfo.status.toLowerCase().replace(/\s+/g, '_')
      acc[statusKey] = (acc[statusKey] || 0) + 1
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
    
    // 4. GENERAR FILTROS POR TODOS LOS STATUS REALES DETECTADOS
    Object.entries(statusCounts)
      .sort(([,a], [,b]) => b - a) // Ordenar por cantidad (mayor a menor)
      .forEach(([statusKey, count]) => {
        if (count === 0) return
        
        const percentage = Math.round((count / total) * 100)
        const rate = (count / total) * 100
        
        // Obtener configuración basada en el status real
        let statusConfig
        if (statusKey === 'completada') {
          statusConfig = {
            label: `Completadas (${count})`,
            icon: '✅',
            description: `✅ ${count} ventas completadas exitosamente - ${rate.toFixed(1)}% del total`,
            priority: 'high'
          }
        } else if (statusKey === 'requiere_atención') {
          statusConfig = {
            label: `Requieren Atención (${count})`,
            icon: '🚨',
            description: `🚨 ${count} conversaciones abandonadas que requieren seguimiento - ${rate.toFixed(1)}% del total`,
            priority: 'high'
          }
        } else if (statusKey === 'en_proceso') {
          statusConfig = {
            label: `En Proceso (${count})`,
            icon: '🔄',
            description: `🔄 ${count} conversaciones activas en desarrollo - ${rate.toFixed(1)}% del total`,
            priority: 'medium'
          }
        } else if (statusKey === 'pendiente') {
          statusConfig = {
            label: `Pendientes (${count})`,
            icon: '⏳',
            description: `⏳ ${count} conversaciones esperando respuesta o acción - ${rate.toFixed(1)}% del total`,
            priority: 'medium'
          }
        } else {
          statusConfig = {
            label: `📝 ${statusKey.charAt(0).toUpperCase() + statusKey.slice(1).replace(/_/g, ' ')} (${count})`,
            icon: '📝',
            description: `📝 ${count} conversaciones con estado: ${statusKey.replace(/_/g, ' ')} - ${rate.toFixed(1)}% del total`,
            priority: 'low'
          }
        }
        
        filters.push({
          id: `status_${statusKey}`,
          label: statusConfig.label,
          icon: statusConfig.icon,
          count,
          percentage,
          description: statusConfig.description,
          priority: statusConfig.priority as 'high' | 'medium' | 'low',
          filterLogic: (conv) => {
            const convStatusInfo = getConversationStatus(conv)
            const convStatusKey = convStatusInfo.status.toLowerCase().replace(/\s+/g, '_')
            return convStatusKey === statusKey
          }
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
      // Filtro para ventas completadas usando lógica AVANZADA sincronizada
      const realCompletedSales = conversations.filter(isCompletedSale).length
      if (realCompletedSales > 0) {
        filters.push({
          id: 'metric_completed_sales',
          label: `Ventas Completadas (${realCompletedSales})`,
          icon: '✅',
          count: realCompletedSales,
          percentage: Math.round((realCompletedSales / total) * 100),
          description: `✅ ${realCompletedSales} conversaciones que resultaron en venta (detectadas por IA avanzada) - ${((realCompletedSales / total) * 100).toFixed(1)}% del total`,
          priority: 'high',
          filterLogic: (conv) => isCompletedSale(conv)
        })
      }
      
      // Filtro para conversaciones abandonadas usando lógica AVANZADA sincronizada
      const realAbandonedChats = conversations.filter(isAbandonedConversation).length
      if (realAbandonedChats > 0) {
        filters.push({
          id: 'metric_abandoned',
          label: `Abandonadas (${realAbandonedChats})`,
          icon: '❌',
          count: realAbandonedChats,
          percentage: Math.round((realAbandonedChats / total) * 100),
          description: `❌ ${realAbandonedChats} conversaciones abandonadas (detectadas por IA avanzada) - ${((realAbandonedChats / total) * 100).toFixed(1)}% oportunidades de recuperación`,
          priority: 'medium',
          filterLogic: (conv) => isAbandonedConversation(conv)
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
            label: `Alto Potencial Conversión (${highConversionCount})`,
            icon: '🎯',
            count: highConversionCount,
            percentage: Math.round((highConversionCount / total) * 100),
            description: `🎯 ${highConversionCount} conversaciones con alta probabilidad de conversión (tasa actual: ${metrics.conversionRate.toFixed(1)}%)`,
            priority: 'high',
            filterLogic: (conv) => {
              const advancedPotential = getAdvancedSalesPotential(conv)
              return advancedPotential.level === 'high'
            }
          })
        }
      }

      // 7. FILTROS ADICIONALES BASADOS EN MÉTRICAS DE ENGAGEMENT Y TENDENCIAS
      
      // Filtro para Alto Engagement (basado en número de mensajes)
      const highEngagementCount = conversations.filter(c => c.totalMessages > 10).length
      if (highEngagementCount > 0) {
        filters.push({
          id: 'metric_high_engagement',
          label: `Alto Engagement (${highEngagementCount})`,
          icon: '💬',
          count: highEngagementCount,
          percentage: Math.round((highEngagementCount / total) * 100),
          description: `💬 ${highEngagementCount} conversaciones con alto engagement (>10 mensajes) - ${((highEngagementCount / total) * 100).toFixed(1)}% del total`,
          priority: 'medium',
          filterLogic: (conv) => conv.totalMessages > 10
        })
      }

      // Filtro para Conversaciones con Tiempo de Respuesta Rápido
      const fastResponseCount = conversations.filter(c => 
        c.metadata?.responseTime && c.metadata.responseTime <= 30
      ).length
      if (fastResponseCount > 0) {
        filters.push({
          id: 'metric_fast_response',
          label: `Respuesta Rápida (${fastResponseCount})`,
          icon: '⚡',
          count: fastResponseCount,
          percentage: Math.round((fastResponseCount / total) * 100),
          description: `⚡ ${fastResponseCount} conversaciones con respuesta rápida (≤30 min) - ${((fastResponseCount / total) * 100).toFixed(1)}% del total`,
          priority: 'medium',
          filterLogic: (conv) => !!(conv.metadata?.responseTime && conv.metadata.responseTime <= 30)
        })
      }

      // Filtro para Conversaciones con Alta Satisfacción
      const highSatisfactionCount = conversations.filter(c => 
        c.metadata?.satisfaction && c.metadata.satisfaction >= 4
      ).length
      if (highSatisfactionCount > 0) {
        filters.push({
          id: 'metric_high_satisfaction',
          label: `Alta Satisfacción (${highSatisfactionCount})`,
          icon: '⭐',
          count: highSatisfactionCount,
          percentage: Math.round((highSatisfactionCount / total) * 100),
          description: `⭐ ${highSatisfactionCount} conversaciones con alta satisfacción (≥4/5) - ${((highSatisfactionCount / total) * 100).toFixed(1)}% del total`,
          priority: 'high',
          filterLogic: (conv) => !!(conv.metadata?.satisfaction && conv.metadata.satisfaction >= 4)
        })
      }

      // Filtro para Oportunidades de Recuperación (abandonadas con alto potencial)
      const recoveryOpportunitiesCount = conversations.filter(c => {
        const isAbandoned = c.status === ConversationStatus.ABANDONED || ['abandonado', 'perdido'].includes(c.status.toLowerCase())
        const advancedPotential = getAdvancedSalesPotential(c)
        return isAbandoned && (advancedPotential.level === 'medium' || advancedPotential.level === 'high')
      }).length
      
      if (recoveryOpportunitiesCount > 0) {
        filters.push({
          id: 'metric_recovery_opportunities',
          label: `Oportunidades Recuperables (${recoveryOpportunitiesCount})`,
          icon: '🔄',
          count: recoveryOpportunitiesCount,
          percentage: Math.round((recoveryOpportunitiesCount / total) * 100),
          description: `🔄 ${recoveryOpportunitiesCount} conversaciones abandonadas con potencial medio/alto - ${((recoveryOpportunitiesCount / total) * 100).toFixed(1)}% del total`,
          priority: 'high',
          filterLogic: (conv) => {
            const isAbandoned = conv.status === ConversationStatus.ABANDONED || ['abandonado', 'perdido'].includes(conv.status.toLowerCase())
            const advancedPotential = getAdvancedSalesPotential(conv)
            return isAbandoned && (advancedPotential.level === 'medium' || advancedPotential.level === 'high')
          }
        })
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

    // Aplicar filtros de IA con lógica SINCRONIZADA con el panel de IA
    if (selectedAIFilters.length > 0) {
      console.log('🔍 Aplicando filtros de IA:', selectedAIFilters)
      filtered = filtered.filter(conv => {
        return selectedAIFilters.some(filterId => {
          // Usar la MISMA lógica de clasificación que en AIInsightsPanel
          const suggestion = conv.aiSuggestion?.toLowerCase() || ''
          const interest = conv.interest?.toLowerCase() || ''
          const lastMessage = conv.lastMessage?.toLowerCase() || ''
          
          // Clasificar la conversación usando la MISMA lógica de prioridad
          let convCategory = 'general' // Por defecto
          
          // 1. Prioridad alta: Oportunidades de venta (alta conversión)
          if (conv.salesPotential === 'high' || 
              suggestion.includes('negocia') || 
              suggestion.includes('oferta') || 
              suggestion.includes('descuento')) {
            convCategory = 'negotiation'
          }
          // 2. Consultas de precio (específicas)
          else if (interest.includes('precio') || 
                   interest.includes('costo') || 
                   lastMessage.includes('precio') || 
                   lastMessage.includes('cuanto')) {
            convCategory = 'pricing'
          }
          // 3. Seguimiento activo
          else if (conv.status === 'active' || 
                   suggestion.includes('seguimiento') || 
                   suggestion.includes('follow') || 
                   suggestion.includes('continuar')) {
            convCategory = 'followUp'
          }
          // 4. Soporte y problemas
          else if (interest.includes('soporte') || 
                   interest.includes('ayuda') || 
                   interest.includes('problema') || 
                   suggestion.includes('soporte')) {
            convCategory = 'support'
          }
          // 5. Conversación proactiva (pendientes)
          else if (conv.status === 'pending' || 
                   suggestion.includes('iniciar') || 
                   suggestion.includes('proactiv') || 
                   suggestion.includes('contactar')) {
            convCategory = 'proactive'
          }
          // 6. General (resto)
          else {
            convCategory = 'general'
          }
          
          // Retornar si la conversación pertenece a la categoría del filtro
          return convCategory === filterId
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







  // 📝 MEJORA: FUNCIÓN PARA RESUMEN UNIFORME Y CLARO
  const getUniformSummary = (conv: Conversation) => {
    const interest = getStandardizedInterest(conv)
    const status = getConversationStatus(conv)
    
    // Obtener una muestra más útil del último mensaje
    let lastMessageSample = conv.lastMessage
    if (lastMessageSample.includes('- Cliente:') || lastMessageSample.includes('- Asesor:')) {
      // Si es formato WhatsApp, extraer solo el contenido del cliente
      const clientMessages = lastMessageSample.split('\n')
        .filter(line => line.includes('- Cliente:'))
        .map(line => line.replace(/^.*- Cliente:\s*/, '').trim())
        .filter(msg => msg.length > 0)
      
      if (clientMessages.length > 0) {
        lastMessageSample = clientMessages[clientMessages.length - 1] // Último mensaje del cliente
      }
    }
    
    // Limpiar y truncar mensaje
    const cleanMessage = lastMessageSample
      .replace(/\[.*?\]/g, '') // Remover [etiquetas]
      .replace(/^-\s*/, '') // Remover guiones iniciales
      .trim()
    
    const messagePreview = cleanMessage.length > 50 
      ? cleanMessage.substring(0, 50) + '...'
      : cleanMessage
    
    // Crear resumen más humano y comprensible
    const interestText = interest.label.replace(/[🤖🧾🛒💰💬🏷️]/g, '').trim()
    
    if (conv.totalMessages <= 1) {
      return `${conv.customerName} inició contacto. ${interestText}. Dice: "${messagePreview}"`
    } else if (status.status === 'Requiere atención') {
      return `${conv.customerName} abandonó conversación. Último interés: ${interestText}. Dijo: "${messagePreview}"`
    } else if (interest.category === 'Comercial') {
      return `${conv.customerName} muestra interés comercial. ${interestText}. Último mensaje: "${messagePreview}"`
    } else {
      return `${conv.customerName} - ${status.status}. ${interestText}. Conversación: ${conv.totalMessages} mensajes. Dice: "${messagePreview}"`
    }
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
                            color: parametrizedSuggestion.priority === '🚀' ? '#22c55e' : 
                                  parametrizedSuggestion.priority === '🎯' ? '#f59e0b' : '#ef4444',
                            backgroundColor: parametrizedSuggestion.priority === '🚀' ? '#f0fdf4' : 
                                            parametrizedSuggestion.priority === '🎯' ? '#fffbeb' : '#fef2f2',
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