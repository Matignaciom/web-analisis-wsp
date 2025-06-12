import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  BarChart3, 
  FileText, 
  FileSpreadsheet, 
  CheckCircle2, 
  Circle,
  MessageSquare,
  Clock,
  Target,
  Users,
  CheckCircle,
  XCircle,
  TrendingUp
} from 'lucide-react'
import styles from './ExportPage.module.css'
import { useConversations } from '../../store/useAppStore'
import { useExport } from '@/hooks/useExport'
import type { ExportOptions } from '@/infrastructure/services/ExportService'
import type { Conversation } from '@/domain/entities/Conversation'
import { IntentType, SentimentLabel } from '@/domain/entities/AnalysisResult'
import { useDynamicDashboard } from '@/hooks/useDynamicDashboard'

interface ExportPageProps {
  className?: string
}

const ExportPage: React.FC<ExportPageProps> = ({ className = '' }) => {
  const conversations = useConversations()
  const { exportToPDF, exportToExcel, isExporting } = useExport()
  
  // Usar el mismo hook que el Dashboard para obtener métricas consistentes
  const { dashboard, isLoading: dashboardLoading, error: dashboardError } = useDynamicDashboard({
    conversations,
    autoUpdate: true
  })

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeCharts: true,
    includeAnalysis: true,
    includeMetrics: true
  })

  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  })

  // Verificar si hay datos disponibles
  const isDataAvailable = conversations.length > 0

  // Crear datos de exportación usando las mismas métricas del dashboard
  const exportData = {
    conversations,
    metrics: dashboard?.mainMetrics,
    dynamicMetrics: dashboard?.dynamicMetrics,
    aiInsights: dashboard?.insights,
    analysisResults: conversations.map(conversation => {
      // Simulación básica de análisis results si no están disponibles
      if (!conversation.aiSummary && !conversation.aiSuggestion) return null
      
      const getIntentFromConversation = (conversation: Conversation): IntentType => {
        const lastMessage = conversation.lastMessage?.toLowerCase() || ''
        
        if (lastMessage.includes('precio') || lastMessage.includes('costo') || lastMessage.includes('cuánto')) {
          return IntentType.PRICE_INQUIRY
        }
        if (lastMessage.includes('comprar') || lastMessage.includes('quiero') || lastMessage.includes('me interesa')) {
          return IntentType.PURCHASE_INTENT
        }
        if (lastMessage.includes('disponible') || lastMessage.includes('stock') || lastMessage.includes('tienen')) {
          return IntentType.STOCK_CHECK
        }
        if (lastMessage.includes('problema') || lastMessage.includes('queja') || lastMessage.includes('mal')) {
          return IntentType.COMPLAINT
        }
        if (lastMessage.includes('ayuda') || lastMessage.includes('soporte') || lastMessage.includes('dudas')) {
          return IntentType.SUPPORT
        }
        return IntentType.GENERAL_INFO
      }

      const getCategoryFromIntent = (intent: IntentType): string => {
        const categories: Record<IntentType, string> = {
          [IntentType.PRICE_INQUIRY]: 'Consulta Comercial',
          [IntentType.PURCHASE_INTENT]: 'Intención de Compra', 
          [IntentType.STOCK_CHECK]: 'Verificación de Stock',
          [IntentType.COMPLAINT]: 'Queja/Reclamo',
          [IntentType.SUPPORT]: 'Soporte Técnico',
          [IntentType.GENERAL_INFO]: 'Información General',
          [IntentType.NEGOTIATION]: 'Negociación',
          [IntentType.FOLLOW_UP]: 'Seguimiento'
        }
        return categories[intent] || 'General'
      }

      return {
        id: `analysis-${conversation.id}`,
        conversationId: conversation.id,
        timestamp: new Date(),
        sentiment: {
          score: 0.5,
          label: SentimentLabel.NEUTRAL,
          confidence: 0.8,
          keywords: []
        },
        intent: {
          primary: {
            type: getIntentFromConversation(conversation),
            category: getCategoryFromIntent(getIntentFromConversation(conversation)),
            description: 'Análisis automático basado en contenido',
            confidence: 0.8
          },
          confidence: 0.8
        },
        summary: conversation.aiSummary || `Conversación con ${conversation.customerName}`,
        keyInsights: conversation.aiSuggestion ? [conversation.aiSuggestion] : [],
        recommendations: [],
        confidence: 0.8
      }
    }).filter((item): item is NonNullable<typeof item> => item !== null)
  }

  const handleOptionChange = (option: keyof ExportOptions) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }))
  }

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }))
    
    // Si ambas fechas están seleccionadas, actualizar las opciones de exportación
    if (value && (field === 'start' ? dateRange.end : dateRange.start)) {
      setExportOptions(prev => ({
        ...prev,
        dateRange: {
          start: new Date(field === 'start' ? value : dateRange.start),
          end: new Date(field === 'end' ? value : dateRange.end)
        }
      }))
    }
  }

  const handleExportPDF = async () => {
    if (!isDataAvailable) return
    await exportToPDF(exportData, exportOptions)
  }

  const handleExportExcel = async () => {
    if (!isDataAvailable) return
    await exportToExcel(exportData, exportOptions)
  }

  // Usar las métricas del dashboard si están disponibles, sino calcular básicas
  const getDataSummary = () => {
    if (!isDataAvailable || !dashboard) return null

    const { mainMetrics } = dashboard

    return {
      total: mainMetrics.totalConversations,
      completed: mainMetrics.completedSales,
      abandoned: mainMetrics.abandonedChats,
      pending: conversations.filter(c => 
        (c.status as any) === 'pending' || (c.status as any) === 'PENDING'
      ).length,
      active: conversations.filter(c => 
        (c.status as any) === 'active' || (c.status as any) === 'ACTIVE'
      ).length,
      withAIAnalysis: conversations.filter(c => c.aiSummary || c.aiSuggestion).length,
      averageResponseTime: mainMetrics.averageResponseTime,
      conversionRate: mainMetrics.conversionRate,
      satisfactionScore: mainMetrics.satisfactionScore,
      dateRange: {
        start: conversations[0]?.startDate,
        end: conversations[conversations.length - 1]?.startDate
      }
    }
  }

  const summary = getDataSummary()

  if (!isDataAvailable) {
    return (
      <div className={`${styles.exportPage} ${className}`}>
        <motion.div 
          className={styles.emptyState}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.emptyIcon}>
            <FileText size={64} />
          </div>
          <h2>📋 No hay datos para exportar</h2>
          <p>
            Primero necesitas cargar y procesar conversaciones de WhatsApp 
            para poder generar reportes.
          </p>
          <div className={styles.emptyActions}>
            <button 
              className={styles.primaryButton}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Ir a Cargar Datos
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Mostrar loading si el dashboard se está cargando
  if (dashboardLoading) {
    return (
      <div className={`${styles.exportPage} ${className}`}>
        <div className={styles.content}>
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            background: '#f8fafc', 
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
            <h4 style={{ color: '#374151', marginBottom: '8px' }}>Preparando datos para exportación...</h4>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Calculando métricas de rendimiento y generando insights
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Mostrar error si hay problemas con el dashboard
  if (dashboardError) {
    return (
      <div className={`${styles.exportPage} ${className}`}>
        <div className={styles.content}>
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            background: '#fef2f2', 
            borderRadius: '12px',
            border: '1px solid #fecaca'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h4 style={{ color: '#dc2626', marginBottom: '8px' }}>Error generando métricas</h4>
            <p style={{ color: '#991b1b', fontSize: '14px' }}>
              {dashboardError}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${styles.exportPage} ${className}`}>
      <div className={styles.content}>
        {/* Panel de Configuración */}
        <motion.div 
          className={styles.configPanel}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className={styles.sectionHeader}>
            <Settings size={20} />
            <h3>Configuración de Exportación</h3>
          </div>

          <div className={styles.optionsGroup}>
            <h4>📊 Contenido a Incluir</h4>
            
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={exportOptions.includeMetrics}
                onChange={() => handleOptionChange('includeMetrics')}
              />
              <span className={styles.checkmark}>
                {exportOptions.includeMetrics ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              </span>
              Métricas del Negocio
            </label>

            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={exportOptions.includeAnalysis}
                onChange={() => handleOptionChange('includeAnalysis')}
              />
              <span className={styles.checkmark}>
                {exportOptions.includeAnalysis ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              </span>
              Análisis Completo de IA
            </label>

            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={exportOptions.includeCharts}
                onChange={() => handleOptionChange('includeCharts')}
              />
              <span className={styles.checkmark}>
                {exportOptions.includeCharts ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              </span>
              Métricas Dinámicas e Insights
            </label>
          </div>

          <div className={styles.optionsGroup}>
            <h4>📅 Rango de Fechas (Opcional)</h4>
            <div className={styles.dateRange}>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className={styles.dateInput}
              />
              <span>hasta</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className={styles.dateInput}
              />
            </div>
          </div>
        </motion.div>

        {/* Panel de Preview - Ahora usa las mismas métricas del Dashboard */}
        <motion.div 
          className={styles.previewPanel}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className={styles.sectionHeader}>
            <BarChart3 size={20} />
            <h3>Vista Previa de Datos</h3>
            <span style={{ 
              fontSize: '12px', 
              color: '#6b7280', 
              fontStyle: 'italic',
              marginLeft: '8px'
            }}>
              (Mismas métricas del Dashboard)
            </span>
          </div>

          {summary && dashboard && (
            <div className={styles.dataSummary}>
              {/* Métricas principales - iguales al Dashboard */}
              <div className={styles.summaryCard}>
                <Users className={styles.summaryIcon} style={{color: '#3b82f6'}} />
                <div className={styles.summaryContent}>
                  <h4>Total Conversaciones</h4>
                  <p className={styles.summaryValue}>{summary.total.toLocaleString()}</p>
                  <span className={styles.summarySubtext}>Del archivo Excel cargado</span>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <CheckCircle className={styles.summaryIcon} style={{color: '#10b981'}} />
                <div className={styles.summaryContent}>
                  <h4>Ventas Completadas</h4>
                  <p className={styles.summaryValue}>{summary.completed.toLocaleString()}</p>
                  <span className={styles.summarySubtext}>
                    {summary.conversionRate.toFixed(1)}% tasa de conversión
                  </span>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <XCircle className={styles.summaryIcon} style={{color: '#ef4444'}} />
                <div className={styles.summaryContent}>
                  <h4>Conversaciones Abandonadas</h4>
                  <p className={styles.summaryValue}>{summary.abandoned.toLocaleString()}</p>
                  <span className={styles.summarySubtext}>
                    {summary.total > 0 ? `${((summary.abandoned / summary.total) * 100).toFixed(1)}%` : '0%'} del total
                  </span>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <Clock className={styles.summaryIcon} style={{color: '#f59e0b'}} />
                <div className={styles.summaryContent}>
                  <h4>Tiempo Promedio Respuesta</h4>
                  <p className={styles.summaryValue}>{summary.averageResponseTime}</p>
                  <span className={styles.summarySubtext}>Calculado desde datos reales</span>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <Target className={styles.summaryIcon} style={{color: '#8b5cf6'}} />
                <div className={styles.summaryContent}>
                  <h4>Tasa de Conversión</h4>
                  <p className={styles.summaryValue}>{summary.conversionRate.toFixed(1)}%</p>
                  <span className={styles.summarySubtext}>Basado en estados del Excel</span>
                </div>
              </div>

              {/* Solo mostrar satisfacción si hay datos reales */}
              {summary.satisfactionScore !== undefined && summary.satisfactionScore > 0 && (
                <div className={styles.summaryCard}>
                  <MessageSquare className={styles.summaryIcon} style={{color: '#10b981'}} />
                  <div className={styles.summaryContent}>
                    <h4>Satisfacción Promedio</h4>
                    <p className={styles.summaryValue}>{summary.satisfactionScore.toFixed(1)}/5</p>
                    <span className={styles.summarySubtext}>Datos disponibles en Excel</span>
                  </div>
                </div>
              )}

              {/* Métricas dinámicas del dashboard */}
              {dashboard.dynamicMetrics && dashboard.dynamicMetrics.length > 0 && (
                <div className={styles.summaryCard}>
                  <TrendingUp className={styles.summaryIcon} style={{color: '#06b6d4'}} />
                  <div className={styles.summaryContent}>
                    <h4>Métricas Dinámicas</h4>
                    <p className={styles.summaryValue}>{dashboard.dynamicMetrics.length}</p>
                    <span className={styles.summarySubtext}>Insights generados por IA</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={styles.previewInfo}>
            <h4>📋 Contenido del Reporte</h4>
            <ul className={styles.contentList}>
              <li>✅ Lista completa de {summary?.total || 0} conversaciones</li>
              {exportOptions.includeMetrics && <li>✅ Métricas de rendimiento y KPIs empresariales (idénticas al Dashboard)</li>}
              {exportOptions.includeAnalysis && <li>✅ Análisis de IA: sentimientos, intenciones y resúmenes</li>}
              {exportOptions.includeCharts && dashboard?.dynamicMetrics && <li>✅ {dashboard.dynamicMetrics.length} métricas dinámicas generadas por IA</li>}
              <li>✅ Resumen ejecutivo con hallazgos clave</li>
              <li>✅ Recomendaciones inteligentes y plan de acción</li>
              <li>✅ Análisis de {summary?.completed || 0} ventas completadas y {summary?.abandoned || 0} abandonadas</li>
            </ul>
          </div>
        </motion.div>
      </div>

      {/* Botones de Exportación */}
      <motion.div 
        className={styles.exportActions}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className={`${styles.exportButton} ${styles.pdfButton}`}
        >
          <FileText size={20} />
          {isExporting ? 'Generando Reporte IA...' : 'Exportar PDF Completo'}
        </button>

        <button
          onClick={handleExportExcel}
          disabled={isExporting}
          className={`${styles.exportButton} ${styles.excelButton}`}
        >
          <FileSpreadsheet size={20} />
          {isExporting ? 'Generando Análisis...' : 'Exportar Excel con IA'}
        </button>
      </motion.div>

      {/* Footer informativo */}
      <motion.div 
        className={styles.footer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className={styles.footerContent}>
          <div className={styles.formatInfo}>
            <h4>📄 Formato PDF</h4>
            <p>Reporte ejecutivo con análisis completo de IA, métricas dinámicas y recomendaciones</p>
          </div>
          <div className={styles.formatInfo}>
            <h4>📊 Formato Excel</h4>
            <p>Datos estructurados con análisis de IA en múltiples hojas para análisis profundo</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ExportPage 