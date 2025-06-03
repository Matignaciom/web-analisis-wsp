import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, 
  FileSpreadsheet, 
  Download, 
  Settings, 
  BarChart3, 
  MessageSquare, 
  Brain,
  Calendar,
  CheckCircle2,
  Circle
} from 'lucide-react'
import { useExport } from '@/hooks/useExport'
import { useDashboardMetrics, useConversations } from '@/presentation/store/useAppStore'
import type { ExportOptions } from '@/infrastructure/services/ExportService'
import styles from './ExportPage.module.css'

interface ExportPageProps {
  className?: string
}

const ExportPage: React.FC<ExportPageProps> = ({ className = '' }) => {
  const { exportToPDF, exportToExcel, isExporting } = useExport()
  const conversations = useConversations()
  const metrics = useDashboardMetrics()

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeMetrics: true,
    includeAnalysis: false,
    includeCharts: false,
    dateRange: undefined
  })

  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  })

  const exportData = useMemo(() => ({
    conversations,
    metrics: metrics || undefined
  }), [conversations, metrics])

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

    return {
      total: conversations.length,
      completed: completedCount,
      active: activeCount,
      abandoned: abandonedCount,
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
              onClick={() => window.location.href = '/upload'}
            >
              Cargar Datos
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
          Genera reportes profesionales de tus análisis de conversaciones WhatsApp
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
              Métricas del Dashboard
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
              Análisis de IA (Próximamente)
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
              Gráficos y Visualizaciones (Próximamente)
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
                <Circle className={styles.summaryIcon} style={{color: '#f59e0b'}} />
                <div className={styles.summaryContent}>
                  <h4>Activas</h4>
                  <p className={styles.summaryValue}>{summary.active}</p>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <Circle className={styles.summaryIcon} style={{color: '#ef4444'}} />
                <div className={styles.summaryContent}>
                  <h4>Abandonadas</h4>
                  <p className={styles.summaryValue}>{summary.abandoned}</p>
                </div>
              </div>
            </div>
          )}

          <div className={styles.previewInfo}>
            <h4>📋 Contenido del Reporte</h4>
            <ul className={styles.contentList}>
              <li>✅ Lista completa de conversaciones</li>
              {exportOptions.includeMetrics && <li>✅ Métricas y KPIs del dashboard</li>}
              {exportOptions.includeAnalysis && <li>⏳ Análisis de sentimientos e intenciones</li>}
              {exportOptions.includeCharts && <li>⏳ Gráficos y visualizaciones</li>}
              <li>✅ Resumen ejecutivo con recomendaciones</li>
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
          {isExporting ? 'Generando...' : 'Exportar PDF'}
        </button>

        <button
          onClick={handleExportExcel}
          disabled={isExporting}
          className={`${styles.exportButton} ${styles.excelButton}`}
        >
          <FileSpreadsheet size={20} />
          {isExporting ? 'Generando...' : 'Exportar Excel'}
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
            <p>Reporte profesional con tablas, métricas y resumen ejecutivo</p>
          </div>
          <div className={styles.formatInfo}>
            <h4>📊 Formato Excel</h4>
            <p>Datos estructurados en múltiples hojas para análisis avanzado</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ExportPage 