import { useState, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Toaster, toast } from 'react-hot-toast'
import Layout from '@/presentation/components/Layout'
import Dashboard from '@/presentation/components/Dashboard'
import FileUploader from '@/presentation/components/FileUploader'
import './App.css'

// Componente para la página de carga de archivos
const UploadPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file)
    setError(null)
    toast.success(`Archivo "${file.name}" cargado correctamente`)
    console.log('Archivo seleccionado:', file.name)
  }, [])

  const handleFileProcess = useCallback(async () => {
    if (!selectedFile) {
      toast.error('No hay archivo seleccionado')
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setError(null)

    try {
      // Simular procesamiento con progreso
      const steps = [
        { message: 'Validando archivo...', progress: 20 },
        { message: 'Extrayendo datos...', progress: 40 },
        { message: 'Analizando conversaciones...', progress: 60 },
        { message: 'Procesando con IA...', progress: 80 },
        { message: 'Generando métricas...', progress: 100 }
      ]

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 800))
        setProgress(step.progress)
        toast.loading(step.message, { id: 'processing' })
      }

      toast.success('¡Archivo procesado exitosamente!', { id: 'processing' })
      
      // Aquí podrías actualizar el estado global con los resultados
      // useAppStore.getState().setDashboardMetrics(newMetrics)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error procesando archivo'
      setError(errorMessage)
      toast.error(errorMessage, { id: 'processing' })
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }, [selectedFile])

  return (
    <motion.section 
      className="upload-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="upload-header">
        <h2>Cargar Datos para Análisis</h2>
        <p>
          Sube tu archivo Excel o CSV con los datos de conversaciones de WhatsApp 
          para obtener un análisis detallado con inteligencia artificial.
        </p>
      </div>
      
      <FileUploader 
        onFileSelect={handleFileSelect}
        onFileProcess={handleFileProcess}
        acceptedFormats={['.xlsx', '.csv']}
        maxSizeInMB={25}
        isProcessing={isProcessing}
        progress={progress}
        error={error}
      />
    </motion.section>
  )
}

// Componente para la página del dashboard
const DashboardPage = () => {
  const mockMetrics = {
    totalConversations: 1247,
    completedSales: 342,
    abandonedChats: 156,
    averageResponseTime: '2.5 min',
    conversionRate: 27.4,
    satisfactionScore: 4.2
  }

  return (
    <motion.section 
      className="dashboard-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Dashboard metrics={mockMetrics} />
    </motion.section>
  )
}

// Placeholder para conversaciones
const ConversationsPage = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="upload-section"
  >
    <h2>Conversaciones</h2>
    <p>Aquí se mostrarán todas las conversaciones analizadas.</p>
  </motion.div>
)

// Placeholder para exportar
const ExportPage = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="upload-section"
  >
    <h2>Exportar Datos</h2>
    <p>Aquí podrás exportar los resultados del análisis.</p>
  </motion.div>
)

function App() {
  return (
    <>
      <Router>
        <Layout title="Análisis Comercial WhatsApp">
          <div className="app-content">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/conversations" element={<ConversationsPage />} />
              <Route path="/export" element={<ExportPage />} />
            </Routes>
          </div>
        </Layout>
      </Router>
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500'
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff'
            }
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff'
            }
          }
        }}
      />
    </>
  )
}

export default App
