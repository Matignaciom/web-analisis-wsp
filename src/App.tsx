import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { Dashboard } from '@/presentation/components/Dashboard'
import { FileUploader } from '@/presentation/components/FileUploader'
import ConversationModal from '@/presentation/components/ConversationModal'

import AIInsightsPanel from '@/presentation/components/AIInsightsPanel'
import DetailedAnalysisTable from '@/presentation/components/DetailedAnalysisTable'

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
        ? [] // Si el filtro ya está activo, lo desactivamos (array vacío)
        : [filterId] // Si no está activo, activamos solo este filtro
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
          <h2>📁 Cargar Archivo de Conversaciones</h2>
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

        <div className="security-note" style={{ marginTop: '24px' }}>
          <strong>🔒 Seguridad:</strong> Todos los archivos se almacenan de forma segura en Supabase Storage 
          con políticas de acceso restringido. Los datos se procesan de manera privada y confidencial.
        </div>
      </div>

      {/* Dashboard Section - Visible cuando hay datos */}
      {conversations.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>📈 Métricas de Rendimiento</h2>
            <p>Resumen ejecutivo y métricas clave de rendimiento</p>
          </div>
          
          <Dashboard 
            conversations={conversations}
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
            <h2>💾 Descargar Análisis</h2>
            <p>Exporta tus resultados en formato PDF o Excel</p>
          </div>
          
          <ExportPage />
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
