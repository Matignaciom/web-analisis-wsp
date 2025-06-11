import React from 'react'
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
  Brain,
  Copy,
  Bot
} from 'lucide-react'
import type { Conversation } from '../../../domain/entities/Conversation'
import { useDynamicDashboard } from '../../../hooks/useDynamicDashboard'
import type { DynamicMetric } from '../../../infrastructure/services/DynamicMetricsService'
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

  const getTrendClass = () => {
    if (!trend) return ''
    return styles[`trend${trend.direction.charAt(0).toUpperCase() + trend.direction.slice(1)}`]
  }

  return (
    <div className={`${styles.metricCard} ${styles[color]}`}>
      <div className={styles.metricIcon}>
        {icon}
      </div>
      <div className={styles.metricContent}>
        <h3 className={styles.metricTitle}>{title}</h3>
        <div className={styles.metricValue}>{value}</div>
        {subtitle && <p className={styles.metricSubtitle}>{subtitle}</p>}
        {trend && (
          <div className={styles.trendContainer}>
            {getTrendIcon()}
            <span className={`${styles.trendValue} ${getTrendClass()}`}>
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// Nuevo componente para texto copiable generado por IA
interface CopyableAITextProps {
  text: string
  label: string
  source: 'ai-analysis' | 'ai-summary' | 'ai-insight' | 'ai-recommendation'
}

const CopyableAIText: React.FC<CopyableAITextProps> = ({ text, label, source }) => {
  const [copied, setCopied] = React.useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error copiando texto:', err)
    }
  }

  const getSourceIcon = () => {
    switch (source) {
      case 'ai-analysis':
        return <Brain size={14} />
      case 'ai-summary':
        return <Bot size={14} />
      case 'ai-insight':
        return <Target size={14} />
      case 'ai-recommendation':
        return <CheckCircle size={14} />
      default:
        return <Brain size={14} />
    }
  }

  const getSourceLabel = () => {
    switch (source) {
      case 'ai-analysis':
        return 'Análisis IA'
      case 'ai-summary':
        return 'Resumen IA'
      case 'ai-insight':
        return 'Insight IA'
      case 'ai-recommendation':
        return 'Recomendación IA'
      default:
        return 'Generado por IA'
    }
  }

  return (
    <div className={styles.copyableContainer}>
      <div className={styles.aiSourceIndicator}>
        {getSourceIcon()}
        <span>{getSourceLabel()}</span>
      </div>
      <div className={styles.copyableText}>
        <span className={styles.textLabel}>{label}:</span>
        <p className={styles.aiGeneratedText}>{text}</p>
        <button 
          onClick={copyToClipboard}
          className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
          title="Copiar texto generado por IA"
        >
          <Copy size={16} />
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
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
  isLoading: propIsLoading = false
}) => {
  // Usar el hook para generar dashboard dinámico basado en IA
  const { dashboard, isLoading: dashboardLoading, error } = useDynamicDashboard({
    conversations,
    autoUpdate: true
  })

  const isLoading = propIsLoading || dashboardLoading

  // Función para renderizar métricas dinámicas
  const renderDynamicMetric = (metric: DynamicMetric) => {
    const getIconForMetric = (iconString?: string) => {
      // Si no hay icono específico, usar uno por defecto basado en el tipo
      if (!iconString) {
        switch (metric.type) {
          case 'number': return <Target size={24} />
          case 'percentage': return <TrendingUp size={24} />
          case 'currency': return <CheckCircle size={24} />
          default: return <Brain size={24} />
        }
      }
      return <span style={{ fontSize: '24px' }}>{iconString}</span>
    }

    const getColorForCategory = (category?: string): 'blue' | 'green' | 'red' | 'yellow' | 'purple' => {
      switch (category) {
        case 'Análisis de Ventas': return 'green'
        case 'Análisis de Clientes': return 'blue'
        case 'Recursos Humanos': return 'purple'
        case 'Análisis Temporal': return 'yellow'
        case 'Análisis de Contenido': return 'blue'
        case 'Satisfacción del Cliente': return 'green'
        case 'Ventas': return 'green'
        case 'Clientes': return 'blue'
        case 'Engagement': return 'blue'
        default: return 'blue'
      }
    }

    return (
      <MetricCard
        key={`dynamic-${metric.title}`}
        title={metric.title}
        value={metric.value}
        icon={getIconForMetric(metric.icon)}
        color={getColorForCategory(metric.category)}
        trend={metric.trend}
        subtitle={metric.category}
      />
    )
  }

  if (isLoading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}>
            <div className={styles.spinner}></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.dashboardTitle}>
          <p style={{ color: '#ef4444' }}>Error al generar métricas: {error}</p>
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.dashboardTitle}>
          <p>Generando métricas dinámicas...</p>
        </div>
      </div>
    )
  }

  const { mainMetrics, dynamicMetrics, insights } = dashboard

  return (
    <div className={styles.dashboard}>
      {/* Insights generados por IA */}
      <div className={styles.aiContentSection}>
        <div className={styles.aiContentGrid}>
          <CopyableAIText 
            text={insights.summary}
            label="Resumen de Datos"
            source="ai-summary"
          />
          <CopyableAIText 
            text={insights.keyFindings.join(" • ")}
            label="Hallazgos Clave"
            source="ai-insight"
          />
          <CopyableAIText 
            text={insights.recommendations.join(" • ")}
            label="Recomendaciones"
            source="ai-recommendation"
          />
        </div>
      </div>

      {/* Métricas principales extraídas 100% del Excel */}
      <div className={styles.metricsGrid}>
        {/* SIEMPRE mostrar métricas básicas ya que vienen del Excel */}
        <MetricCard
          title="Total Conversaciones"
          value={mainMetrics.totalConversations.toLocaleString()}
          icon={<Users size={24} />}
          color="blue"
          subtitle="Del archivo Excel cargado"
        />
        
        <MetricCard
          title="Ventas Completadas"
          value={mainMetrics.completedSales.toLocaleString()}
          icon={<CheckCircle size={24} />}
          color="green"
          subtitle={`${((mainMetrics.completedSales / mainMetrics.totalConversations) * 100).toFixed(1)}% del total`}
        />
        
        <MetricCard
          title="Conversaciones Abandonadas"
          value={mainMetrics.abandonedChats.toLocaleString()}
          icon={<XCircle size={24} />}
          color="red"
          subtitle={`${((mainMetrics.abandonedChats / mainMetrics.totalConversations) * 100).toFixed(1)}% del total`}
        />
        
        <MetricCard
          title="Tiempo Promedio Respuesta"
          value={mainMetrics.averageResponseTime}
          icon={<Clock size={24} />}
          color="yellow"
          subtitle="Calculado desde datos reales"
        />

        <MetricCard
          title="Tasa de Conversión"
          value={`${mainMetrics.conversionRate.toFixed(1)}%`}
          icon={<Target size={24} />}
          color="purple"
          subtitle="Basado en estados del Excel"
        />

        {/* Solo mostrar satisfacción si hay datos reales */}
        {mainMetrics.satisfactionScore !== undefined && mainMetrics.satisfactionScore > 0 && (
          <MetricCard
            title="Satisfacción Promedio"
            value={`${mainMetrics.satisfactionScore.toFixed(1)}/5`}
            icon={<MessageSquare size={24} />}
            color="green"
            subtitle="Datos disponibles en Excel"
          />
        )}
      </div>

      {/* Análisis Avanzado de Datos - Siempre generado dinámicamente si hay datos */}
      {dynamicMetrics && dynamicMetrics.length > 0 && conversations.length > 0 && (
        <div className={styles.dynamicSection}>
          <h3 className={styles.sectionTitle}>
            📈 Análisis Avanzado de Datos
          </h3>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
            Métricas inteligentes generadas automáticamente basadas en el análisis de tus conversaciones
          </p>
          <div className={styles.dynamicGrid}>
            {dynamicMetrics.map((metric) => renderDynamicMetric(metric))}
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay suficientes datos para análisis avanzado */}
      {(!dynamicMetrics || dynamicMetrics.length === 0) && conversations.length > 0 && (
        <div className={styles.dynamicSection}>
          <h3 className={styles.sectionTitle}>
            📈 Análisis Avanzado de Datos
          </h3>
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            background: '#f8fafc', 
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
            <h4 style={{ color: '#374151', marginBottom: '8px' }}>Generando análisis inteligente...</h4>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              El sistema está procesando tus datos para generar métricas personalizadas y insights avanzados
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard 