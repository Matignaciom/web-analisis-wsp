import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, 
  FileSpreadsheet, 
  Settings, 
  BarChart3, 
  MessageSquare, 
  CheckCircle2,
  Circle,
  Brain,
  Target
} from 'lucide-react'
import { useExport } from '@/hooks/useExport'
import { useDashboardMetrics, useConversations } from '@/presentation/store/useAppStore'
import { useDynamicDashboard } from '@/hooks/useDynamicDashboard'
import type { ExportOptions } from '@/infrastructure/services/ExportService'
import { SentimentLabel, IntentType } from '@/domain/entities/AnalysisResult'
import styles from './ExportPage.module.css'

interface ExportPageProps {
  className?: string
}

const ExportPage: React.FC<ExportPageProps> = ({ className = '' }) => {
  const { exportToPDF, exportToExcel, isExporting } = useExport()
  const conversations = useConversations()
  const metrics = useDashboardMetrics()
  
  // Obtener dashboard dinámico con análisis de IA
  const { dashboard } = useDynamicDashboard({
    conversations,
    autoUpdate: true
  })

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeMetrics: true,
    includeAnalysis: true,
    includeCharts: true,
    dateRange: undefined
  })

  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  })

  // Crear datos enriquecidos para exportación con análisis de IA
  const exportData = useMemo(() => {
    const analysisResults = conversations
      .filter(conv => conv.aiSummary || conv.aiSuggestion || conv.interest || conv.salesPotential)
      .map(conv => ({
        id: `ai-analysis-${conv.id}`,
        conversationId: conv.id,
        timestamp: new Date(),
        sentiment: {
          score: conv.salesPotential === 'high' ? 0.8 : conv.salesPotential === 'medium' ? 0.5 : 0.2,
          label: conv.salesPotential === 'high' ? SentimentLabel.POSITIVE : conv.salesPotential === 'medium' ? SentimentLabel.NEUTRAL : SentimentLabel.NEGATIVE,
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
      conversations,
      analysisResults,
      metrics: dashboard?.mainMetrics || metrics || undefined,
      dynamicMetrics: dashboard?.dynamicMetrics || [],
      aiInsights: dashboard?.insights || undefined
    }
  }, [conversations, metrics, dashboard])

  const isDataAvailable = conversations.length > 0

  const handleOptionChange = (option: keyof ExportOptions) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }))
  }

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }))
    
    if (dateRange.start && dateRange.end) {
      setExportOptions(prev => ({
        ...prev,
        dateRange: {
          start: new Date(dateRange.start),
          end: new Date(dateRange.end)
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

  const getDataSummary = () => {
    if (!isDataAvailable) return null

    const completedCount = conversations.filter(c => c.status === 'completed').length
    const activeCount = conversations.filter(c => c.status === 'active').length
    const abandonedCount = conversations.filter(c => c.status === 'abandoned').length
    const withAIAnalysis = conversations.filter(c => c.aiSummary || c.aiSuggestion).length

    return {
      total: conversations.length,
      completed: completedCount,
      active: activeCount,
      abandoned: abandonedCount,
      withAIAnalysis,
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
          <h2>📤 No hay datos para exportar</h2>
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

  return (
    <div className={`${styles.exportPage} ${className}`}>
      <motion.div 
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className={styles.title}>📤 Exportar Resultados</h1>
        <p className={styles.subtitle}>
          Genera reportes profesionales de tus análisis de conversaciones WhatsApp con IA avanzada
        </p>
      </motion.div>

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

        {/* Panel de Preview */}
        <motion.div 
          className={styles.previewPanel}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className={styles.sectionHeader}>
            <BarChart3 size={20} />
            <h3>Vista Previa de Datos</h3>
          </div>

          {summary && (
            <div className={styles.dataSummary}>
              <div className={styles.summaryCard}>
                <MessageSquare className={styles.summaryIcon} />
                <div className={styles.summaryContent}>
                  <h4>Total Conversaciones</h4>
                  <p className={styles.summaryValue}>{summary.total}</p>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <CheckCircle2 className={styles.summaryIcon} style={{color: '#10b981'}} />
                <div className={styles.summaryContent}>
                  <h4>Completadas</h4>
                  <p className={styles.summaryValue}>{summary.completed}</p>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <Brain className={styles.summaryIcon} style={{color: '#8b5cf6'}} />
                <div className={styles.summaryContent}>
                  <h4>Con Análisis IA</h4>
                  <p className={styles.summaryValue}>{summary.withAIAnalysis}</p>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <Target className={styles.summaryIcon} style={{color: '#f59e0b'}} />
                <div className={styles.summaryContent}>
                  <h4>Métricas Dinámicas</h4>
                  <p className={styles.summaryValue}>{exportData.dynamicMetrics?.length || 0}</p>
                </div>
              </div>
            </div>
          )}

          <div className={styles.previewInfo}>
            <h4>📋 Contenido del Reporte</h4>
            <ul className={styles.contentList}>
              <li>✅ Lista completa de conversaciones analizadas</li>
              {exportOptions.includeMetrics && <li>✅ Métricas y KPIs del negocio</li>}
              {exportOptions.includeAnalysis && <li>✅ Análisis completo de IA (sentimientos, intenciones, resúmenes)</li>}
              {exportOptions.includeCharts && <li>✅ Métricas dinámicas e insights generados por IA</li>}
              <li>✅ Resumen ejecutivo con recomendaciones inteligentes</li>
              <li>✅ Sugerencias de acción personalizadas por conversación</li>
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