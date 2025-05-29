import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Users, CheckCircle, XCircle, Clock } from 'lucide-react'
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
    switch (trend?.direction) {
      case 'up':
        return <TrendingUp size={16} className={styles.trendUp} />
      case 'down':
        return <TrendingDown size={16} className={styles.trendDown} />
      default:
        return <Minus size={16} className={styles.trendNeutral} />
    }
  }

  return (
    <motion.div 
      className={`${styles.metricCard} ${styles[color]}`}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className={styles.metricIcon}>{icon}</div>
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
    </motion.div>
  )
}

interface DashboardProps {
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
  metrics = {
    totalConversations: 0,
    completedSales: 0,
    abandonedChats: 0,
    averageResponseTime: '0 min'
  },
  isLoading = false,
  dynamicData
}) => {
  const formatValue = (value: string | number, type: string): string => {
    switch (type) {
      case 'percentage':
        return `${value}%`
      case 'currency':
        return `$${Number(value).toLocaleString()}`
      case 'number':
        return Number(value).toLocaleString()
      default:
        return String(value)
    }
  }

  const mainMetrics = [
    {
      title: "Total Conversaciones",
      value: metrics.totalConversations.toLocaleString(),
      icon: <Users size={24} />,
      color: 'blue' as const,
      trend: { value: 12.5, direction: 'up' as const },
      subtitle: 'vs mes anterior'
    },
    {
      title: "Ventas Concretadas",
      value: metrics.completedSales.toLocaleString(),
      icon: <CheckCircle size={24} />,
      color: 'green' as const,
      trend: { value: 8.3, direction: 'up' as const },
      subtitle: `${metrics.conversionRate?.toFixed(1) || '0'}% conversión`
    },
    {
      title: "Abandonos",
      value: metrics.abandonedChats.toLocaleString(),
      icon: <XCircle size={24} />,
      color: 'red' as const,
      trend: { value: -5.2, direction: 'down' as const },
      subtitle: 'Reducción del abandono'
    },
    {
      title: "Tiempo Promedio",
      value: metrics.averageResponseTime,
      icon: <Clock size={24} />,
      color: 'yellow' as const,
      trend: { value: -15.8, direction: 'down' as const },
      subtitle: 'Mejora en respuesta'
    }
  ]

  if (metrics.satisfactionScore) {
    mainMetrics.push({
      title: "Satisfacción",
      value: `${metrics.satisfactionScore.toFixed(1)}/5`,
      icon: <TrendingUp size={24} />,
      color: 'blue' as const,
      trend: { value: 3.7, direction: 'up' as const },
      subtitle: 'Puntuación promedio'
    })
  }

  return (
    <div className={styles.dashboard}>
      <motion.h2 
        className={styles.dashboardTitle}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Dashboard de Métricas
      </motion.h2>
      
      <motion.div 
        className={styles.metricsGrid}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {mainMetrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
          >
            <MetricCard {...metric} />
          </motion.div>
        ))}
      </motion.div>

      {/* Datos dinámicos de Excel */}
      {dynamicData && dynamicData.length > 0 && (
        <motion.div 
          className={styles.dynamicSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h3 className={styles.sectionTitle}>Datos Dinámicos del Archivo</h3>
          <div className={styles.dynamicGrid}>
            {dynamicData.map((item, index) => (
              <motion.div
                key={`${item.title}-${index}`}
                className={styles.dynamicCard}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <h4 className={styles.dynamicTitle}>{item.title}</h4>
                <p className={styles.dynamicValue}>
                  {formatValue(item.value, item.type)}
                </p>
                {item.category && (
                  <span className={styles.dynamicCategory}>{item.category}</span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h3 className={styles.sectionTitle}>Análisis por Intención</h3>
        <div className={styles.intentionsGrid}>
          {[
            { label: 'Consultas de Precio', value: 45, color: '#3b82f6' },
            { label: 'Consultas de Stock', value: 30, color: '#10b981' },
            { label: 'Métodos de Pago', value: 15, color: '#f59e0b' },
            { label: 'Soporte Técnico', value: 10, color: '#ef4444' }
          ].map((intention, index) => (
            <motion.div
              key={intention.label}
              className={styles.intentionCard}
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <div className={styles.intentionHeader}>
                <span className={styles.intentionLabel}>{intention.label}</span>
                <span className={styles.intentionValue}>{intention.value}%</span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ 
                    backgroundColor: intention.color,
                    width: `${intention.value}%`
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Loading state */}
      {isLoading && (
        <motion.div
          className={styles.loadingOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className={styles.loadingSpinner}>
            <div className={styles.spinner}></div>
            <p>Cargando métricas...</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default Dashboard 