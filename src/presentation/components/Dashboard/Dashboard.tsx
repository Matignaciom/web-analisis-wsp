import React, { useMemo } from 'react'
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  MessageSquare,
  Target,
  DollarSign,
  Star,
  Activity
} from 'lucide-react'
import type { Conversation } from '@/domain/entities/Conversation'
import styles from './Dashboard.module.css'

interface MetricCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  subtitle?: string
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon, 
  color, 
  trend,
  subtitle 
}) => {
  const getTrendIcon = () => {
    if (!trend) return null
    
    switch (trend.direction) {
      case 'up':
        return <TrendingUp size={16} className={styles.trendUp} />
      case 'down':
        return <TrendingDown size={16} className={styles.trendDown} />
      default:
        return <Minus size={16} className={styles.trendNeutral} />
    }
  }

  return (
    <div className={`${styles.metricCard} ${styles[color]}`}>
      <div className={styles.metricIcon}>
        {icon}
      </div>
      <div className={styles.metricContent}>
        <h3 className={styles.metricTitle}>{title}</h3>
        <p className={styles.metricValue}>{value}</p>
        {subtitle && <p className={styles.metricSubtitle}>{subtitle}</p>}
        {trend && (
          <div className={styles.trendContainer}>
            {getTrendIcon()}
            <span className={styles.trendValue}>
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

interface DashboardProps {
  conversations?: Conversation[]
  metrics?: {
    totalConversations: number
    completedSales: number
    abandonedChats: number
    averageResponseTime: string | number
    conversionRate?: number
    satisfactionScore?: number
  }
  isLoading?: boolean
  dynamicData?: Array<{
    title: string
    value: string | number
    type: 'number' | 'percentage' | 'currency' | 'text'
    category?: string
  }>
}

const Dashboard: React.FC<DashboardProps> = ({ 
  conversations = [],
  metrics = {
    totalConversations: 0,
    completedSales: 0,
    abandonedChats: 0,
    averageResponseTime: '0 min'
  },
  isLoading = false,
  dynamicData
}) => {

  // Cálculo de métricas avanzadas localmente (económico)
  const enhancedMetrics = useMemo(() => {
    if (!conversations || conversations.length === 0) {
      return {
        ...metrics,
        conversionRate: 0,
        activeChats: 0,
        pendingChats: 0,
        avgMessagesPerConversation: 0,
        topAgent: 'N/A',
        busyHour: 'N/A',
        satisfactionTrend: 0,
        responseEfficiency: 0,
        salesPotentialHigh: 0,
        recentActivity: 0
      }
    }

    const total = conversations.length
    const completed = conversations.filter(c => c.status === 'completed').length
    const abandoned = conversations.filter(c => c.status === 'abandoned').length
    const active = conversations.filter(c => c.status === 'active').length
    const pending = conversations.filter(c => c.status === 'pending').length

    // Tasa de conversión local
    const conversionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    // Promedio de mensajes
    const avgMessages = total > 0 ? 
      Math.round(conversations.reduce((sum, c) => sum + (c.totalMessages || 0), 0) / total) : 0

    // Agente más activo (económico - solo conteo)
    const agentCounts: Record<string, number> = {}
    conversations.forEach(c => {
      if (c.assignedAgent) {
        agentCounts[c.assignedAgent] = (agentCounts[c.assignedAgent] || 0) + 1
      }
    })
    const topAgent = Object.keys(agentCounts).length > 0 ? 
      Object.entries(agentCounts).sort(([,a], [,b]) => b - a)[0][0] : 'N/A'

    // Hora más activa (análisis simple por fecha)
    const hourCounts: Record<number, number> = {}
    conversations.forEach(c => {
      if (c.startDate) {
        const hour = new Date(c.startDate).getHours()
        hourCounts[hour] = (hourCounts[hour] || 0) + 1
      }
    })
    const busyHour = Object.keys(hourCounts).length > 0 ? 
      `${Object.entries(hourCounts).sort(([,a], [,b]) => b - a)[0][0]}:00` : 'N/A'

    // Eficiencia de respuesta (basado en metadata si existe)
    const withResponseTime = conversations.filter(c => 
      c.metadata?.responseTime && c.metadata.responseTime > 0
    )
    const responseEfficiency = withResponseTime.length > 0 ? 
      Math.round(withResponseTime.filter(c => c.metadata!.responseTime! <= 30).length / withResponseTime.length * 100) : 0

    // Potencial de ventas alto
    const salesPotentialHigh = conversations.filter(c => c.salesPotential === 'high').length

    // Actividad reciente (últimas 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentActivity = conversations.filter(c => 
      new Date(c.startDate) > oneDayAgo
    ).length

    return {
      ...metrics,
      totalConversations: total,
      completedSales: completed,
      abandonedChats: abandoned,
      activeChats: active,
      pendingChats: pending,
      conversionRate,
      avgMessagesPerConversation: avgMessages,
      topAgent,
      busyHour,
      responseEfficiency,
      salesPotentialHigh,
      recentActivity,
      satisfactionTrend: 0 // Placeholder para futura implementación
    }
  }, [conversations, metrics])

  const formatValue = (value: string | number, type: string): string => {
    if (typeof value === 'number') {
      switch (type) {
        case 'currency':
          return new Intl.NumberFormat('es-MX', { 
            style: 'currency', 
            currency: 'MXN' 
          }).format(value)
        case 'percentage':
          return `${value}%`
        default:
          return value.toLocaleString()
      }
    }
    return String(value)
  }

  // Calcular tendencias simples (comparación con métricas anteriores)
  const calculateTrend = (current: number, previous: number = 0): { value: number; direction: 'up' | 'down' | 'neutral' } => {
    if (previous === 0) return { value: 0, direction: 'neutral' }
    const change = Math.round(((current - previous) / previous) * 100)
    return {
      value: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    }
  }

  // Métricas de intención (análisis local simple)
  const intentionMetrics = useMemo(() => {
    if (!conversations || conversations.length === 0) {
      return [
        { label: 'Consultas de Precio', value: 0, color: '#3b82f6' },
        { label: 'Intención de Compra', value: 0, color: '#10b981' },
        { label: 'Soporte/Quejas', value: 0, color: '#f59e0b' },
        { label: 'Información General', value: 0, color: '#6366f1' }
      ]
    }

    // Análisis básico por palabras clave en último mensaje
    const priceKeywords = ['precio', 'costo', 'cuanto', 'valor', '$', '€']
    const purchaseKeywords = ['comprar', 'pedir', 'quiero', 'necesito', 'pedido']
    const supportKeywords = ['problema', 'ayuda', 'soporte', 'mal', 'error', 'queja']

    let priceInquiries = 0
    let purchaseIntents = 0
    let supportRequests = 0
    let generalInfo = 0

    conversations.forEach(conv => {
      const message = (conv.lastMessage || '').toLowerCase()
      
      if (priceKeywords.some(keyword => message.includes(keyword))) {
        priceInquiries++
      } else if (purchaseKeywords.some(keyword => message.includes(keyword))) {
        purchaseIntents++
      } else if (supportKeywords.some(keyword => message.includes(keyword))) {
        supportRequests++
      } else {
        generalInfo++
      }
    })

    const total = conversations.length
    return [
      { 
        label: 'Consultas de Precio', 
        value: total > 0 ? Math.round((priceInquiries / total) * 100) : 0, 
        color: '#3b82f6' 
      },
      { 
        label: 'Intención de Compra', 
        value: total > 0 ? Math.round((purchaseIntents / total) * 100) : 0, 
        color: '#10b981' 
      },
      { 
        label: 'Soporte/Quejas', 
        value: total > 0 ? Math.round((supportRequests / total) * 100) : 0, 
        color: '#f59e0b' 
      },
      { 
        label: 'Información General', 
        value: total > 0 ? Math.round((generalInfo / total) * 100) : 0, 
        color: '#6366f1' 
      }
    ]
  }, [conversations])

  if (isLoading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}>
            <div className={styles.spinner}></div>
            <p>Calculando métricas...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardTitle}>
        <h2>📊 Dashboard de Conversaciones</h2>
        <p>Análisis en tiempo real de tu negocio WhatsApp</p>
      </div>

      {/* Métricas principales */}
      <div className={styles.metricsGrid}>
        <MetricCard
          title="Total Conversaciones"
          value={enhancedMetrics.totalConversations}
          icon={<Users size={24} />}
          color="blue"
          trend={calculateTrend(enhancedMetrics.totalConversations, metrics.totalConversations)}
          subtitle={`${enhancedMetrics.recentActivity} nuevas (24h)`}
        />
        
        <MetricCard
          title="Ventas Completadas"
          value={enhancedMetrics.completedSales}
          icon={<CheckCircle size={24} />}
          color="green"
          trend={calculateTrend(enhancedMetrics.completedSales, metrics.completedSales)}
          subtitle={`${enhancedMetrics.conversionRate}% conversión`}
        />
        
        <MetricCard
          title="Conversaciones Activas"
          value={enhancedMetrics.activeChats}
          icon={<MessageSquare size={24} />}
          color="yellow"
          subtitle="En progreso"
        />
        
        <MetricCard
          title="Chats Abandonados"
          value={enhancedMetrics.abandonedChats}
          icon={<XCircle size={24} />}
          color="red"
          trend={calculateTrend(enhancedMetrics.abandonedChats, metrics.abandonedChats)}
        />

        <MetricCard
          title="Tiempo de Respuesta"
          value={enhancedMetrics.averageResponseTime}
          icon={<Clock size={24} />}
          color="purple"
          subtitle={`${enhancedMetrics.responseEfficiency}% eficiencia`}
        />

        <MetricCard
          title="Alto Potencial de Venta"
          value={enhancedMetrics.salesPotentialHigh}
          icon={<Target size={24} />}
          color="green"
          subtitle="Leads calificados"
        />
      </div>

      {/* Sección de análisis de intenciones */}
      <div className={styles.dynamicSection}>
        <h3 className={styles.sectionTitle}>🎯 Análisis de Intenciones</h3>
        <div className={styles.intentionsGrid}>
          {intentionMetrics.map((intention, index) => (
            <div key={index} className={styles.intentionCard}>
              <div className={styles.intentionHeader}>
                <span className={styles.intentionLabel}>{intention.label}</span>
                <span className={styles.intentionValue}>{intention.value}%</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ 
                    width: `${intention.value}%`,
                    backgroundColor: intention.color 
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Datos dinámicos adicionales */}
      {dynamicData && dynamicData.length > 0 && (
        <div className={styles.dynamicSection}>
          <h3 className={styles.sectionTitle}>📈 Métricas Adicionales</h3>
          <div className={styles.dynamicGrid}>
            {dynamicData.map((data, index) => (
              <div key={index} className={styles.dynamicCard}>
                <h4 className={styles.dynamicTitle}>{data.title}</h4>
                <p className={styles.dynamicValue}>
                  {formatValue(data.value, data.type)}
                </p>
                {data.category && (
                  <span className={styles.dynamicCategory}>{data.category}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información del agente más activo */}
      {enhancedMetrics.topAgent !== 'N/A' && (
        <div className={styles.dynamicSection}>
          <h3 className={styles.sectionTitle}>⭐ Destacados</h3>
          <div className={styles.dynamicGrid}>
            <div className={styles.dynamicCard}>
              <h4 className={styles.dynamicTitle}>Agente Más Activo</h4>
              <p className={styles.dynamicValue}>{enhancedMetrics.topAgent}</p>
              <span className={styles.dynamicCategory}>Mejor desempeño</span>
            </div>
            <div className={styles.dynamicCard}>
              <h4 className={styles.dynamicTitle}>Hora Pico</h4>
              <p className={styles.dynamicValue}>{enhancedMetrics.busyHour}</p>
              <span className={styles.dynamicCategory}>Mayor actividad</span>
            </div>
            <div className={styles.dynamicCard}>
              <h4 className={styles.dynamicTitle}>Promedio Mensajes</h4>
              <p className={styles.dynamicValue}>{enhancedMetrics.avgMessagesPerConversation}</p>
              <span className={styles.dynamicCategory}>Por conversación</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard 