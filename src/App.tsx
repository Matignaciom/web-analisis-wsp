import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { Dashboard } from '@/presentation/components/Dashboard'
import { FileUploader } from '@/presentation/components/FileUploader'
import { ConversationsTable } from '@/presentation/components/ConversationsTable'
import ConversationModal from '@/presentation/components/ConversationModal'
import CostOptimization from '@/presentation/components/CostOptimization'
import AIInsightsPanel from '@/presentation/components/AIInsightsPanel'
import DetailedAnalysisTable from '@/presentation/components/DetailedAnalysisTable'
import SampleDataButton from '@/presentation/components/SampleDataButton/SampleDataButton'
import { useFileProcessor } from '@/hooks/useFileProcessor'
import { useConversationUpdater } from '@/hooks/useConversationUpdater'
import { useConversations } from '@/presentation/store/useAppStore'
import type { Conversation } from '@/domain/entities/Conversation'
import ExportPage from '@/presentation/components/ExportPage'
import './App.css'

const SinglePageDashboard = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAIFilters, setSelectedAIFilters] = useState<string[]>([])
  const { processFile, isProcessing, progress, error, resetState } = useFileProcessor()
  const conversations = useConversations()
  
  // Hook para actualizar conversaciones con análisis de IA
  useConversationUpdater()

  const handleFileSelect = (file: File) => {
    console.log('📁 Archivo seleccionado:', file.name)
    resetState()
  }

  const handleFileProcess = async (file: File, uploadedPath?: string) => {
    console.log('🔄 Procesando archivo:', file.name)
    if (uploadedPath) {
      console.log('📁 Archivo subido a:', uploadedPath)
    }
    
    await processFile(file)
    
    if (!error) {
      console.log('✅ Archivo procesado exitosamente')
    }
  }

  const handleUploadComplete = (filePath: string, fileName: string) => {
    console.log('📤 Upload completado:', { filePath, fileName })
  }

  const handleViewConversation = (conversation: Conversation) => {
    console.log('👁️ Viendo conversación:', conversation)
    setSelectedConversation(conversation)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedConversation(null)
  }

  const handleAIFilterSelect = (filterId: string) => {
    setSelectedAIFilters(prev => 
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    )
  }

  const handleClearAIFilters = () => {
    setSelectedAIFilters([])
  }

  const handleRemoveAIFilter = (filterId: string) => {
    setSelectedAIFilters(prev => prev.filter(id => id !== filterId))
  }

  return (
    <div className="single-page-dashboard">
      {/* Header Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            <img 
              src="/images/Logo_FB_AI.png" 
              alt="FB - IA Analytics Logo" 
              className="hero-logo"
            />
            FB - IA Analytics
          </h1>
          <p className="hero-subtitle">
            Análisis inteligente de conversaciones WhatsApp con IA avanzada
          </p>
          <p className="hero-description">
            Obtén insights profundos sobre sentimientos, intenciones y métricas de rendimiento
            de tus conversaciones de manera automática y segura.
          </p>
        </div>
      </div>

      {/* Upload Section - Siempre visible */}
      <div className="upload-section">
        <div className="section-header">
          <h2>📊 Cargar Archivo de Conversaciones</h2>
          <p>
            Sube tu archivo Excel o CSV con las conversaciones para obtener análisis detallados
            usando IA avanzada para sentimientos, intenciones y métricas.
          </p>
        </div>

        <FileUploader
          onFileSelect={handleFileSelect}
          onFileProcess={handleFileProcess}
          onUploadComplete={handleUploadComplete}
          isProcessing={isProcessing}
          progress={progress}
          error={error}
          acceptedFormats={['.xlsx', '.xls', '.csv']}
          maxSizeInMB={25}
          autoUpload={true}
        />

        {error && (
          <div className="error-message">
            <h3>❌ Error en el procesamiento</h3>
            <p>{error}</p>
            <button onClick={resetState} className="retry-button">
              Reintentar
            </button>
          </div>
        )}

        <div className="format-guide">
          <h3>💡 Formato esperado del archivo:</h3>
          <div className="format-columns">
            <div className="format-column">
              <h4>Columnas requeridas:</h4>
              <ul>
                <li><strong>Cliente/Nombre:</strong> Nombre del cliente</li>
                <li><strong>Teléfono/WhatsApp:</strong> Número de teléfono</li>
                <li><strong>Fecha:</strong> Fecha de inicio</li>
                <li><strong>Estado:</strong> activo, completado, abandonado, pendiente</li>
              </ul>
            </div>
            <div className="format-column">
              <h4>Columnas opcionales:</h4>
              <ul>
                <li><strong>Mensajes:</strong> Cantidad total de mensajes</li>
                <li><strong>Último mensaje:</strong> Contenido del último mensaje</li>
                <li><strong>Agente:</strong> Agente asignado</li>
              </ul>
            </div>
          </div>
          
          <div className="security-note">
            <strong>🔒 Seguridad:</strong> Todos los archivos se almacenan de forma segura en Supabase Storage 
            con políticas de acceso restringido. Los datos se procesan de manera privada y confidencial.
          </div>
        </div>

        {/* Botón de datos de muestra */}
        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
            padding: '20px', 
            borderRadius: '12px',
            border: '2px dashed #cbd5e1',
            marginBottom: '16px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#475569' }}>
              🚀 ¿Quieres probar inmediatamente?
            </h4>
            <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '14px' }}>
              Carga datos de muestra para ver todas las funcionalidades en acción
            </p>
            <SampleDataButton />
          </div>
        </div>
      </div>

      {/* Dashboard Section - Visible cuando hay datos */}
      {conversations.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>📊 Dashboard de Análisis</h2>
            <p>Métricas y insights de tus conversaciones de WhatsApp</p>
          </div>
          
          <Dashboard 
            conversations={conversations}
            metrics={{
              totalConversations: conversations.length,
              completedSales: conversations.filter(c => c.status === 'completed').length,
              abandonedChats: conversations.filter(c => c.status === 'abandoned').length,
              averageResponseTime: conversations.length > 0 ? 
                `${Math.round(conversations.reduce((sum, c) => sum + (c.metadata?.responseTime || 5), 0) / conversations.length)} min` : 
                '0 min'
            }}
            dynamicData={[
              {
                title: 'Clientes Únicos',
                value: new Set(conversations.map(c => c.customerPhone)).size,
                type: 'number',
                category: 'Alcance'
              },
              {
                title: 'Total Mensajes',
                value: conversations.reduce((sum, c) => sum + (c.totalMessages || 0), 0),
                type: 'number',
                category: 'Actividad'
              },
              {
                title: 'Tasa de Conversión',
                value: conversations.length > 0 ? 
                  Math.round((conversations.filter(c => c.status === 'completed').length / conversations.length) * 100) : 0,
                type: 'percentage',
                category: 'Rendimiento'
              },
              {
                title: 'Agentes Activos',
                value: new Set(conversations.filter(c => c.assignedAgent).map(c => c.assignedAgent)).size,
                type: 'number',
                category: 'Equipo'
              }
            ]}
          />
          
          {/* Cost Optimization - Desplegable en el dashboard */}
          <CostOptimization 
            conversationCount={conversations.length}
            className="cost-optimization-widget"
          />
        </div>
      )}

      {/* Cost Optimization - Solo visible si no hay conversaciones */}
      {conversations.length === 0 && (
        <div className="cost-optimization-widget">
          <CostOptimization 
            conversationCount={1000}
          />
        </div>
      )}

      {/* AI Insights Panel - Visible cuando hay datos */}
      {conversations.length > 0 && (
        <AIInsightsPanel
          conversations={conversations}
          selectedFilters={selectedAIFilters}
          onFilterSelect={handleAIFilterSelect}
          onClearFilters={handleClearAIFilters}
        />
      )}

      {/* Detailed Analysis Table - Reemplaza ConversationsTable */}
      {conversations.length > 0 && (
        <DetailedAnalysisTable
          conversations={conversations}
          selectedAIFilters={selectedAIFilters}
          onRemoveAIFilter={handleRemoveAIFilter}
          onViewConversation={handleViewConversation}
        />
      )}

      {/* Export Section - Visible cuando hay datos */}
      {conversations.length > 0 && (
        <div className="export-section">
          <div className="section-header">
            <h2>📋 Exportar Datos</h2>
            <p>Genera reportes en PDF o Excel con los análisis realizados</p>
          </div>
          
          <ExportPage />
        </div>
      )}

      {/* Empty State - Cuando no hay datos */}
      {conversations.length === 0 && !isProcessing && (
        <div className="empty-state">
          <h3>📤 ¡Comienza analizando tus conversaciones!</h3>
          <p>
            Sube un archivo Excel o CSV con tus conversaciones de WhatsApp arriba
            para ver análisis detallados con IA, métricas y insights avanzados.
          </p>
        </div>
      )}

      {/* Footer Stats - Visible cuando hay datos */}
      {conversations.length > 0 && (
        <div className="footer-stats">
          <div className="stats-container">
            <div className="stat-item">
              <span className="stat-value">{conversations.length}</span>
              <span className="stat-label">Conversaciones</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {conversations.filter(c => c.status === 'completed').length}
              </span>
              <span className="stat-label">Completadas</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {conversations.reduce((acc, c) => acc + c.totalMessages, 0)}
              </span>
              <span className="stat-label">Mensajes Total</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {new Set(conversations.filter(c => c.assignedAgent).map(c => c.assignedAgent)).size}
              </span>
              <span className="stat-label">Agentes</span>
            </div>
          </div>
        </div>
      )}

      {selectedConversation && (
        <ConversationModal
          conversation={selectedConversation}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

function App() {
  return (
    <div className="app">
      <SinglePageDashboard />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 5000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 6000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  )
}

export default App
