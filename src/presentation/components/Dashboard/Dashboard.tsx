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

  // 🎯 FUNCIÓN PARA RENDERIZAR LISTAS CORRECTAMENTE
  const renderTextContent = (text: string) => {
    // Si el texto contiene viñetas (•), renderizar como lista
    if (text.includes('• ')) {
      const items = text.split('• ').filter(item => item.trim().length > 0)
      
      return (
        <ul style={{ 
          margin: '0', 
          paddingLeft: '16px', 
          listStyle: 'none',
          lineHeight: '1.6'
        }}>
          {items.map((item, index) => (
            <li key={index} style={{ 
              marginBottom: '8px',
              position: 'relative'
            }}>
              <span style={{ 
                position: 'absolute', 
                left: '-16px', 
                color: '#3b82f6',
                fontWeight: 'bold'
              }}>•</span>
              {item.trim()}
            </li>
          ))}
        </ul>
      )
    }
    
    // Si no tiene viñetas, renderizar como párrafo normal
    return <p className={styles.aiGeneratedText}>{text}</p>
  }

  return (
    <div className={styles.copyableContainer}>
      <div className={styles.aiSourceIndicator}>
        {getSourceIcon()}
        <span>{getSourceLabel()}</span>
      </div>
      <div className={styles.copyableText}>
        <span className={styles.textLabel}>{label}:</span>
        <div className={styles.aiGeneratedText}>
          {renderTextContent(text)}
        </div>
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
  conversations = []
}) => {
  const { dashboard, isLoading, error } = useDynamicDashboard({
    conversations,
    autoUpdate: true
  })

  // 🔍 FUNCIÓN DE DEPURACIÓN PARA VENTAS
  const debugSalesCount = () => {
    if (conversations.length === 0) return
    
    let salesCount = 0
    const salesReasons: string[] = []
    
    conversations.forEach((conv, index) => {
      const salesStatuses = ['completed', 'completado', 'finalizado', 'vendido', 'venta', 'exitoso', 'won', 'closed-won']
      const lastMsg = conv.lastMessage?.toLowerCase() || ''
      const specificSalesKeywords = [
        'vendido', 'venta completada', 'pago realizado', 'pago confirmado', 
        'transferencia realizada', 'factura pagada', 'entrega realizada', 
        'pedido entregado', 'gracias por la compra', 'compra exitosa'
      ]
      
      let isSale = false
      let reason = ''
      
      if (salesStatuses.includes(conv.status.toLowerCase())) {
        isSale = true
        reason = `Status: ${conv.status}`
      } else if (specificSalesKeywords.some(keyword => lastMsg.includes(keyword))) {
        isSale = true
        reason = `Mensaje: "${conv.lastMessage}"`
      }
      
      if (isSale) {
        salesCount++
        salesReasons.push(`Conversación ${index + 1} (${conv.customerName}): ${reason}`)
      }
    })
    
    console.log('🔍 DEBUG - Análisis de ventas:')
    console.log(`Total conversaciones: ${conversations.length}`)
    console.log(`Ventas detectadas: ${salesCount}`)
    console.log('Razones específicas:', salesReasons)
    
    // Mostrar alerta con la información
    if (salesReasons.length > 0) {
      alert(`DEPURACIÓN DE VENTAS:\n\nTotal: ${salesCount} de ${conversations.length} conversaciones\n\nMotivos:\n${salesReasons.join('\n')}`)
    } else {
      alert(`DEPURACIÓN DE VENTAS:\n\nNo se detectaron ventas con los criterios conservadores.\nTotal conversaciones analizadas: ${conversations.length}`)
    }
  }

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

    // ✅ Crear subtítulo con información de trazabilidad
    const getTraceabilitySubtitle = (metric: DynamicMetric): string => {
      const sourceLabels = {
        'excel_direct': '📊 Del Excel',
        'ai_inference': '🤖 Inferido por IA',
        'calculated': '📐 Calculado',
        'simulated': '⚠️ Simulado'
      }
      
      const confidenceLabels = {
        'high': '✅',
        'medium': '⚖️',
        'low': '⚠️'
      }
      
      const sourceLabel = sourceLabels[metric.dataSource] || metric.dataSource
      const confidenceIcon = confidenceLabels[metric.traceability.confidence]
      
      return `${sourceLabel} ${confidenceIcon} | ${metric.category || 'General'}`
    }

    // ✅ Mostrar advertencias si existen
    const subtitle = getTraceabilitySubtitle(metric)
    const hasWarnings = metric.traceability.warnings && metric.traceability.warnings.length > 0

    // ✅ Crear tooltip detallado con información completa
    const createDetailedTooltip = (metric: DynamicMetric): string => {
      const parts = [
        `📊 MÉTRICA: ${metric.title}`,
        `💡 VALOR: ${metric.value}`,
        `🔍 TIPO: ${metric.isObjective ? 'Objetiva (datos directos)' : 'Inferida (estimación)'}`,
        `📋 CATEGORÍA: ${metric.category || 'General'}`,
        `📊 ORIGEN: ${metric.dataSource === 'excel_direct' ? 'Extraído del Excel' : 
                     metric.dataSource === 'calculated' ? 'Calculado matemáticamente' :
                     metric.dataSource === 'ai_inference' ? 'Inferido por IA' : 'Simulado'}`,
        `🎯 CONFIANZA: ${metric.traceability.confidence === 'high' ? 'Alta (>90%)' :
                        metric.traceability.confidence === 'medium' ? 'Media (70-90%)' : 'Baja (<70%)'}`,
        `📍 CAMPOS USADOS: ${metric.traceability.originFields.join(', ') || 'No especificado'}`,
        `🔢 MÉTODO: ${metric.traceability.calculationMethod || 'Análisis directo'}`
      ]
      
      if (metric.traceability.warnings && metric.traceability.warnings.length > 0) {
        parts.push(`⚠️ ADVERTENCIAS: ${metric.traceability.warnings.join('; ')}`)
      }
      
      return parts.join('\n')
    }

    return (
      <div 
        key={`dynamic-${metric.title}`} 
        style={{ position: 'relative' }}
        title={createDetailedTooltip(metric)}
      >
        <div style={{ 
          cursor: 'help',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}>
          <MetricCard
            title={metric.title}
            value={metric.value}
            icon={getIconForMetric(metric.icon)}
            color={getColorForCategory(metric.category)}
            trend={metric.trend}
            subtitle={subtitle}
          />
        </div>
        
        {/* ✅ Indicador de tipo de métrica */}
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          background: metric.isObjective ? '#dcfce7' : '#fef3c7',
          border: `1px solid ${metric.isObjective ? '#16a34a' : '#f59e0b'}`,
          borderRadius: '12px',
          padding: '2px 6px',
          fontSize: '9px',
          fontWeight: 'bold',
          color: metric.isObjective ? '#15803d' : '#92400e',
          zIndex: 1,
          cursor: 'help'
        }} title={metric.isObjective ? 'Métrica Objetiva: Basada en datos directos del Excel' : 'Métrica Inferida: Estimación basada en análisis'}>
          {metric.isObjective ? '📊' : '🔮'}
        </div>

        {/* ✅ Mostrar advertencias si existen */}
        {hasWarnings && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '10px',
            color: '#92400e',
            zIndex: 1,
            cursor: 'help'
          }} title={`⚠️ ADVERTENCIAS:\n${metric.traceability.warnings?.join('\n• ')}`}>
            ⚠️
          </div>
        )}

        {/* ✅ Indicador de nivel de confianza */}
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          background: metric.traceability.confidence === 'high' ? '#dcfce7' : 
                     metric.traceability.confidence === 'medium' ? '#fef3c7' : '#fee2e2',
          border: `1px solid ${metric.traceability.confidence === 'high' ? '#16a34a' : 
                                metric.traceability.confidence === 'medium' ? '#f59e0b' : '#ef4444'}`,
          borderRadius: '50%',
          width: '16px',
          height: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '8px',
          fontWeight: 'bold',
          color: metric.traceability.confidence === 'high' ? '#15803d' : 
                 metric.traceability.confidence === 'medium' ? '#92400e' : '#dc2626',
          zIndex: 1,
          cursor: 'help'
        }} title={`Nivel de Confianza: ${metric.traceability.confidence === 'high' ? 'Alto (>90%)' :
                                        metric.traceability.confidence === 'medium' ? 'Medio (70-90%)' : 'Bajo (<70%)'}`}>
          {metric.traceability.confidence === 'high' ? '✓' : 
           metric.traceability.confidence === 'medium' ? '~' : '!'}
        </div>
      </div>
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
      {/* Header con botón de depuración */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className={styles.dashboardTitle}>
          📊 Dashboard Inteligente - Análisis WhatsApp
        </h2>
        {conversations.length > 0 && (
          <button 
            onClick={debugSalesCount}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            title="Ver exactamente qué conversaciones están siendo contadas como ventas"
          >
            🔍 Depurar Contador de Ventas
          </button>
        )}
      </div>

      {/* Insights generados por IA con información de origen */}
      <div className={styles.aiContentSection}>
        <div style={{ textAlign: 'center', marginBottom: '12px', fontSize: '12px', color: '#6b7280' }}>
          📊 Origen de datos: {insights.dataSourceBreakdown.directFromExcel}% Excel • 
          🤖 {insights.dataSourceBreakdown.aiInferred}% IA • 
          📐 {insights.dataSourceBreakdown.calculated}% Calculado
        </div>
        <div className={styles.aiContentGrid}>
          <CopyableAIText 
            text={insights.summary}
            label="📄 Resumen General"
            source="ai-summary"
          />
          <CopyableAIText 
            text={insights.keyFindings.join("")}
            label="🔍 Patrones Encontrados"
            source="ai-insight"
          />
          <CopyableAIText 
            text={insights.recommendations.join("")}
            label="📊 Resumen de Datos"
            source="ai-recommendation"
          />
        </div>
      </div>

      {/* Métricas principales extraídas del Excel con trazabilidad */}
      <div className={styles.metricsGrid}>
        {/* SIEMPRE mostrar métricas básicas ya que vienen del Excel */}
        <MetricCard
          title="Total Conversaciones"
          value={mainMetrics.totalConversations.toLocaleString()}
          icon={<Users size={24} />}
          color="blue"
          subtitle="📊 Del Excel ✅ | Conteo directo"
        />
        
        <MetricCard
          title="Ventas Completadas"
          value={mainMetrics.completedSales.toLocaleString()}
          icon={<CheckCircle size={24} />}
          color="green"
          subtitle={`📊 Del Excel ⚖️ | ${((mainMetrics.completedSales / mainMetrics.totalConversations) * 100).toFixed(1)}% del total`}
        />
        
        <MetricCard
          title="Conversaciones Abandonadas"
          value={mainMetrics.abandonedChats.toLocaleString()}
          icon={<XCircle size={24} />}
          color="red"
          subtitle={`📊 Del Excel ⚖️ | ${((mainMetrics.abandonedChats / mainMetrics.totalConversations) * 100).toFixed(1)}% del total`}
        />
        
        <MetricCard
          title="Tiempo Promedio Respuesta"
          value={mainMetrics.averageResponseTime}
          icon={<Clock size={24} />}
          color="yellow"
          subtitle={mainMetrics.averageResponseTime.includes('estimado') ? "📐 Calculado ⚠️ | Estimado" : "📊 Del Excel ✅ | Directo"}
        />

        <MetricCard
          title="Tasa de Conversión"
          value={`${mainMetrics.conversionRate.toFixed(1)}%`}
          icon={<Target size={24} />}
          color="purple"
          subtitle="📐 Calculado ✅ | Estados del Excel"
        />

        {/* Solo mostrar satisfacción si hay datos reales */}
        {mainMetrics.satisfactionScore !== undefined && mainMetrics.satisfactionScore > 0 && (
          <MetricCard
            title="Satisfacción Promedio"
            value={`${mainMetrics.satisfactionScore.toFixed(1)}/5`}
            icon={<MessageSquare size={24} />}
            color="green"
            subtitle="📊 Del Excel ✅ | Datos disponibles"
          />
        )}
      </div>

      {/* Análisis Avanzado de Datos - Separado por tipos de métricas */}
      {dynamicMetrics && dynamicMetrics.length > 0 && conversations.length > 0 && (
        <div className={styles.dynamicSection}>
          <h3 className={styles.sectionTitle} style={{ color: '#1e293b' }}>
            📈 Análisis Avanzado de Datos
          </h3>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
            Métricas avanzadas con trazabilidad completa al Excel original
          </p>

          {/* Panel Informativo Detallado */}
          <div style={{ 
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
            border: '2px solid #3b82f6', 
            borderRadius: '12px', 
            padding: '20px', 
            marginBottom: '24px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '24px', marginRight: '12px' }}>ℹ️</div>
              <h4 style={{ color: '#1e40af', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                Guía del Análisis Avanzado
              </h4>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ 
                background: '#ffffff', 
                padding: '16px', 
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <h5 style={{ color: '#16a34a', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                  📊 Métricas Objetivas
                </h5>
                <p style={{ fontSize: '12px', color: '#374151', lineHeight: '1.4', margin: 0 }}>
                  • <strong>Datos directos:</strong> Extraídos tal como aparecen en el Excel<br/>
                  • <strong>Cálculos exactos:</strong> Operaciones matemáticas sobre datos reales<br/>
                  • <strong>100% confiables:</strong> Sin estimaciones ni suposiciones<br/>
                  • <strong>Trazabilidad:</strong> Cada valor referencia su celda original
                </p>
              </div>

              <div style={{ 
                background: '#ffffff', 
                padding: '16px', 
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <h5 style={{ color: '#f59e0b', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                  🔮 Métricas Inferidas
                </h5>
                <p style={{ fontSize: '12px', color: '#374151', lineHeight: '1.4', margin: 0 }}>
                  • <strong>Estimaciones inteligentes:</strong> Basadas en patrones detectados<br/>
                  • <strong>Análisis de tendencias:</strong> Proyecciones y correlaciones<br/>
                  • <strong>Nivel de confianza:</strong> Indicado en cada métrica<br/>
                  • <strong>Advertencias:</strong> Cuando los datos son limitados
                </p>
              </div>
            </div>


          </div>

          {/* ✅ Métricas Objetivas (Datos directos del Excel) */}
          {dynamicMetrics.filter(m => m.isObjective).length > 0 && (
            <>
              <h4 style={{ color: '#16a34a', fontSize: '16px', fontWeight: 'bold', marginTop: '20px', marginBottom: '12px' }}>
                📊 Métricas Objetivas (Basadas en datos del Excel)
              </h4>

              <div className={styles.dynamicGrid}>
                {dynamicMetrics.filter(m => m.isObjective).map((metric) => renderDynamicMetric(metric))}
              </div>
            </>
          )}

          {/* ⚠️ Métricas Inferidas (Estimaciones y cálculos avanzados) */}
          {dynamicMetrics.filter(m => !m.isObjective).length > 0 && (
            <>
              <h4 style={{ color: '#f59e0b', fontSize: '16px', fontWeight: 'bold', marginTop: '20px', marginBottom: '12px' }}>
                🔮 Métricas Inferidas (Estimaciones y análisis avanzado)
              </h4>

              <div className={styles.dynamicGrid}>
                {dynamicMetrics.filter(m => !m.isObjective).map((metric) => renderDynamicMetric(metric))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Mensaje cuando no hay suficientes datos para análisis avanzado */}
      {(!dynamicMetrics || dynamicMetrics.length === 0) && conversations.length > 0 && (
        <div className={styles.dynamicSection}>
          <h3 className={styles.sectionTitle} style={{ color: '#1e293b' }}>
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