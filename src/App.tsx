import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Layout } from '@/presentation/components/Layout'
import { Dashboard } from '@/presentation/components/Dashboard'
import { FileUploader } from '@/presentation/components/FileUploader'
import { useFileProcessor } from '@/hooks/useFileProcessor'
import { useDashboardMetrics, useConversations } from '@/presentation/store/useAppStore'
import ExportPage from '@/presentation/components/ExportPage'
import './App.css'
import { useState } from 'react'

const UploadPage = () => {
  const { processFile, isProcessing, progress, error, resetState } = useFileProcessor()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = (file: File) => {
    console.log('📁 Archivo seleccionado:', {
      name: file?.name || 'Sin nombre',
      size: file?.size || 0,
      type: file?.type || 'Sin tipo',
      isValid: file instanceof File
    })
    setSelectedFile(file)
    resetState()
  }

  const handleFileProcess = async (file: File, uploadedPath?: string) => {
    console.log('🔄 Iniciando procesamiento desde App.tsx:', {
      file: file,
      isFile: file instanceof File,
      name: file?.name,
      uploadedPath: uploadedPath,
      hasFile: !!file
    })
    
    if (!file || !(file instanceof File)) {
      console.error('❌ Archivo inválido recibido en handleFileProcess')
      return
    }
    
    // Procesar el archivo localmente (el archivo ya está en Supabase)
    await processFile(file)
  }

  const handleUploadComplete = (filePath: string, fileName: string) => {
    console.log('☁️ Archivo subido a Supabase:', {
      path: filePath,
      name: fileName
    })
    // El archivo está listo para ser procesado cuando el usuario haga clic en "PROCESAR CON IA"
  }

  return (
    <div className="app-content">
      <div className="upload-header">
        <h2>📊 Análisis de Conversaciones WhatsApp</h2>
        <p>
          Sube tu archivo Excel con las conversaciones para obtener análisis detallados
          de sentimientos, intenciones y métricas de rendimiento usando IA.
        </p>
        <p>
          <strong>✨ Nueva funcionalidad:</strong> Los archivos se guardan automáticamente en la nube 
          para mayor seguridad y acceso desde cualquier dispositivo.
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
        <div className="file-status error">
          <h3>❌ Error en el procesamiento</h3>
          <p>{error}</p>
          <button onClick={resetState} className="process-button">
            Reintentar
          </button>
        </div>
      )}

      <div className="upload-tips">
        <h3>💡 Formato esperado del archivo:</h3>
        <ul>
          <li><strong>Cliente/Nombre:</strong> Nombre del cliente</li>
          <li><strong>Teléfono/WhatsApp:</strong> Número de teléfono</li>
          <li><strong>Fecha:</strong> Fecha de inicio de conversación</li>
          <li><strong>Estado:</strong> activo, completado, abandonado, pendiente</li>
          <li><strong>Mensajes:</strong> Cantidad total de mensajes</li>
          <li><strong>Último mensaje:</strong> Contenido del último mensaje</li>
          <li><strong>Agente:</strong> Agente asignado (opcional)</li>
        </ul>
        <p>
          <strong>Nota:</strong> El sistema detecta automáticamente las columnas usando
          nombres en español e inglés. Los campos mínimos requeridos son Cliente y Teléfono.
        </p>
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          backgroundColor: '#f0f9ff', 
          borderRadius: '8px',
          border: '1px solid #0369a1'
        }}>
          <strong>🔒 Seguridad:</strong> Todos los archivos se almacenan de forma segura en Supabase Storage 
          con políticas de acceso restringido. Los datos se procesan de manera privada y confidencial.
        </div>
      </div>
    </div>
  )
}

const DashboardPage = () => {
  const metrics = useDashboardMetrics()
  const conversations = useConversations()

  const transformedMetrics = metrics ? {
    totalConversations: metrics.totalConversations,
    completedSales: metrics.completedSales,
    abandonedChats: metrics.abandonedChats,
    averageResponseTime: metrics.averageResponseTime,
    conversionRate: metrics.conversionRate || 0,
    satisfactionScore: metrics.satisfactionScore || 0
  } : undefined

  const dynamicData = conversations.length > 0 ? [
    {
      title: 'Conversaciones Hoy',
      value: conversations.filter(c => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return c.startDate >= today
      }).length,
      type: 'number' as const,
      category: 'Actividad'
    },
    {
      title: 'Promedio Mensajes',
      value: Math.round(conversations.reduce((acc, c) => acc + c.totalMessages, 0) / conversations.length) || 0,
      type: 'number' as const,
      category: 'Engagement'
    },
    {
      title: 'Agentes Activos',
      value: new Set(conversations.filter(c => c.assignedAgent).map(c => c.assignedAgent)).size,
      type: 'number' as const,
      category: 'Equipo'
    },
    {
      title: 'Tasa Respuesta',
      value: `${Math.round((conversations.filter(c => c.status === 'completed').length / conversations.length) * 100) || 0}%`,
      type: 'percentage' as const,
      category: 'Eficiencia'
    }
  ] : undefined

  return (
    <div className="app-content">
      <Dashboard 
        metrics={transformedMetrics}
        isLoading={!metrics && conversations.length === 0}
        dynamicData={dynamicData}
      />
      
      {conversations.length === 0 && (
        <div className="upload-header">
          <h3>📤 No hay datos disponibles</h3>
          <p>
            Sube un archivo Excel con conversaciones para ver el análisis completo 
            con métricas de IA, sentimientos e intenciones.
          </p>
        </div>
      )}
    </div>
  )
}

const ConversationsPage = () => {
  const conversations = useConversations()

  return (
    <div className="app-content">
      <h2>💬 Conversaciones Analizadas</h2>
      {conversations.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Mensajes</th>
                <th>Fecha</th>
                <th>Agente</th>
                <th>Último Mensaje</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map(conv => (
                <tr key={conv.id}>
                  <td>{conv.customerName}</td>
                  <td>{conv.customerPhone}</td>
                  <td>
                    <span className={`status status-${conv.status}`}>
                      {conv.status === 'active' ? '🟢 Activo' :
                       conv.status === 'completed' ? '✅ Completado' :
                       conv.status === 'abandoned' ? '🔴 Abandonado' :
                       '⏳ Pendiente'}
                    </span>
                  </td>
                  <td>{conv.totalMessages}</td>
                  <td>{conv.startDate.toLocaleDateString()}</td>
                  <td>{conv.assignedAgent || 'Sin asignar'}</td>
                  <td className="last-message">{conv.lastMessage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="upload-header">
          <p>No hay conversaciones disponibles. Sube un archivo para comenzar el análisis.</p>
        </div>
      )}
    </div>
  )
}

function App() {
  return (
    <Router 
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/upload" replace />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/conversations" element={<ConversationsPage />} />
          <Route path="/export" element={<ExportPage />} />
        </Routes>
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
      </Layout>
    </Router>
  )
}

export default App
