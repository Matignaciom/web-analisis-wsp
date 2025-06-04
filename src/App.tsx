import { useState, useMemo } from 'react'
import { Toaster } from 'react-hot-toast'
import { Dashboard } from '@/presentation/components/Dashboard'
import { FileUploader } from '@/presentation/components/FileUploader'
import { ConversationsTable } from '@/presentation/components/ConversationsTable'
import ConversationModal from '@/presentation/components/ConversationModal'
import { useFileProcessor } from '@/hooks/useFileProcessor'
import { useConversationUpdater } from '@/hooks/useConversationUpdater'
import { useDashboardMetrics, useConversations } from '@/presentation/store/useAppStore'
import type { Conversation } from '@/domain/entities/Conversation'
import ExportPage from '@/presentation/components/ExportPage'
import './App.css'

type ActiveSection = 'upload' | 'dashboard' | 'conversations' | 'export'

const LandingDashboard = () => {
  const [activeSection, setActiveSection] = useState<ActiveSection>('upload')
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { processFile, isProcessing, progress, error, resetState } = useFileProcessor()
  const metrics = useDashboardMetrics()
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
    
    // Habilitar automáticamente la pestaña de Dashboard después del procesamiento
    if (!error) {
      console.log('✅ Archivo procesado, habilitando pestañas')
      setActiveSection('dashboard')
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

  // Optimizar transformación de métricas con useMemo
  const transformedMetrics = useMemo(() => {
    if (!metrics) return undefined
    
    return {
      totalConversations: metrics.totalConversations,
      completedSales: metrics.completedSales,
      abandonedChats: metrics.abandonedChats,
      averageResponseTime: metrics.averageResponseTime,
      conversionRate: metrics.conversionRate || 0,
      satisfactionScore: metrics.satisfactionScore || 0
    }
  }, [metrics])

  // Optimizar cálculos de datos dinámicos con useMemo
  const dynamicData = useMemo(() => {
    if (conversations.length === 0) return undefined
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const conversationsToday = conversations.filter(c => c.startDate >= today).length
    const averageMessages = Math.round(
      conversations.reduce((acc, c) => acc + c.totalMessages, 0) / conversations.length
    ) || 0
    const activeAgents = new Set(
      conversations.filter(c => c.assignedAgent).map(c => c.assignedAgent)
    ).size
    const responseRate = Math.round(
      (conversations.filter(c => c.status === 'completed').length / conversations.length) * 100
    ) || 0

    return [
      {
        title: 'Conversaciones Hoy',
        value: conversationsToday,
        type: 'number' as const,
        category: 'Actividad'
      },
      {
        title: 'Promedio Mensajes',
        value: averageMessages,
        type: 'number' as const,
        category: 'Engagement'
      },
      {
        title: 'Agentes Activos',
        value: activeAgents,
        type: 'number' as const,
        category: 'Equipo'
      },
      {
        title: 'Tasa Respuesta',
        value: `${responseRate}%`,
        type: 'percentage' as const,
        category: 'Eficiencia'
      }
    ]
  }, [conversations])

  return (
    <div className="landing-dashboard">
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

      {/* Navigation Tabs */}
      <div className="navigation-tabs">
        <button 
          className={`nav-tab ${activeSection === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveSection('upload')}
        >
          📤 Subir Datos
        </button>
        <button 
          className={`nav-tab ${activeSection === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveSection('dashboard')}
          disabled={conversations.length === 0}
        >
          📊 Dashboard
        </button>
        <button 
          className={`nav-tab ${activeSection === 'conversations' ? 'active' : ''}`}
          onClick={() => setActiveSection('conversations')}
          disabled={conversations.length === 0}
        >
          💬 Conversaciones
        </button>
        <button 
          className={`nav-tab ${activeSection === 'export' ? 'active' : ''}`}
          onClick={() => setActiveSection('export')}
          disabled={conversations.length === 0}
        >
          📋 Exportar
        </button>
      </div>

      {/* Content Section */}
      <div className="content-section">
        {activeSection === 'upload' && (
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
          </div>
        )}

        {activeSection === 'dashboard' && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>📊 Dashboard de Análisis</h2>
              <p>Vista general de las métricas y análisis de tus conversaciones</p>
            </div>

            <Dashboard 
              metrics={transformedMetrics}
              isLoading={!metrics && conversations.length === 0}
              dynamicData={dynamicData}
            />
            
            {conversations.length === 0 && (
              <div className="empty-state">
                <h3>📤 No hay datos disponibles</h3>
                <p>
                  Sube un archivo Excel con conversaciones para ver el análisis completo
                </p>
                <button 
                  className="upload-button"
                  onClick={() => setActiveSection('upload')}
                >
                  Subir Archivo
                </button>
              </div>
            )}
          </div>
        )}

        {activeSection === 'conversations' && (
          <div className="conversations-section">
            <div className="section-header">
              <h2>💬 Conversaciones Analizadas</h2>
              <p>Detalle completo con análisis IA, resúmenes y sugerencias personalizadas</p>
            </div>

            <ConversationsTable 
              conversations={conversations}
              onViewConversation={handleViewConversation}
            />
          </div>
        )}

        {activeSection === 'export' && (
          <div className="export-section">
            <div className="section-header">
              <h2>📋 Exportar Datos</h2>
              <p>Genera reportes en PDF o Excel con los análisis realizados</p>
            </div>
            
            <ExportPage />
          </div>
        )}
      </div>

      {/* Footer Stats */}
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
      <LandingDashboard />
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
