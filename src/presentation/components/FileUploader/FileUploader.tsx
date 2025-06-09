import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, File, X, CheckCircle, AlertCircle, Sparkles, FileCheck } from 'lucide-react'
import LoadingSpinner from '../common/LoadingSpinner'
import ProgressBar from '../common/ProgressBar'
import { useFileUpload } from '../../hooks/useFileUpload'
import styles from './FileUploader.module.css'

interface FileUploaderProps {
  onFileSelect?: (file: File) => void
  onFileProcess?: (file: File, uploadedPath?: string) => void
  onUploadComplete?: (filePath: string, fileName: string) => void
  acceptedFormats?: string[]
  maxSizeInMB?: number
  isProcessing?: boolean
  progress?: number
  error?: string | null
  className?: string
  autoUpload?: boolean // Nueva prop para controlar subida automática
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  onFileProcess,
  onUploadComplete,
  acceptedFormats = ['.xlsx', '.csv'],
  maxSizeInMB = 25,
  isProcessing = false,
  progress = 0,
  error,
  className = '',
  autoUpload = true
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [showProcessingToast, setShowProcessingToast] = useState(false)
  const [processingComplete, setProcessingComplete] = useState(false)
  const [hasBeenProcessed, setHasBeenProcessed] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Hook para manejar subidas de Supabase
  const { uploadState, uploadFile, resetUpload, clearError } = useFileUpload()

  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Validar tamaño
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024
    if (file.size > maxSizeInBytes) {
      return {
        isValid: false,
        error: `El archivo es muy grande. Máximo ${maxSizeInMB}MB permitido.`
      }
    }

    // Validar formato
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!acceptedFormats.includes(fileExtension)) {
      return {
        isValid: false,
        error: `Formato no válido. Solo se permiten: ${acceptedFormats.join(', ')}`
      }
    }

    return { isValid: true }
  }, [maxSizeInMB, acceptedFormats])

  const handleFileSelect = useCallback(async (file: File) => {
    const validation = validateFile(file)
    if (!validation.isValid) {
      setValidationError(validation.error || 'Archivo inválido')
      return
    }

    setSelectedFile(file)
    setValidationError(null)
    clearError()
    setShowProcessingToast(true)
    onFileSelect?.(file)

    // Si autoUpload está habilitado, subir automáticamente a Supabase
    if (autoUpload) {
      try {
        const uploadResult = await uploadFile(file)
        if (uploadResult.success && uploadResult.path) {
          setShowProcessingToast(false)
          setShowSuccessToast(true)
          onUploadComplete?.(uploadResult.path, file.name)
          
          // Ocultar el toast de éxito después de 4 segundos
          setTimeout(() => {
            setShowSuccessToast(false)
          }, 4000)
        }
      } catch (error) {
        setShowProcessingToast(false)
        console.error('Error en la subida automática:', error)
      }
    }
  }, [validateFile, onFileSelect, autoUpload, uploadFile, clearError, onUploadComplete])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleClick = useCallback(() => {
    if (!isProcessing && !uploadState.isUploading) {
      fileInputRef.current?.click()
    }
  }, [isProcessing, uploadState.isUploading])

  const handleRemoveFile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedFile(null)
    setValidationError(null)
    setShowSuccessToast(false)
    setShowProcessingToast(false)
    setProcessingComplete(false)
    setHasBeenProcessed(false)
    resetUpload()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [resetUpload])

  const handleProcessFile = useCallback(() => {
    if (selectedFile) {
      setProcessingComplete(false)
      // Deshabilitar notificaciones durante el procesamiento
      setShowSuccessToast(false)
      setShowProcessingToast(false)
      onFileProcess?.(selectedFile, uploadState.uploadedFile?.path)
    }
  }, [selectedFile, onFileProcess, uploadState.uploadedFile])

  // Detectar cuando el procesamiento se completa
  const wasProcessing = useRef(false)
  
  React.useEffect(() => {
    if (wasProcessing.current && !isProcessing) {
      // El procesamiento acaba de completarse
      setProcessingComplete(true)
      
      // Marcar como procesado después de mostrar el éxito
      setTimeout(() => {
        setProcessingComplete(false)
        setHasBeenProcessed(true) // Ahora está marcado como procesado permanentemente
      }, 2000) // Reducido a 2 segundos
    }
    wasProcessing.current = isProcessing
  }, [isProcessing])

  const handleProcessAgain = useCallback(() => {
    if (selectedFile && window.confirm('¿Estás seguro de que quieres procesar el archivo nuevamente? Esto puede sobrescribir los resultados anteriores.')) {
      setHasBeenProcessed(false)
      setProcessingComplete(false)
      onFileProcess?.(selectedFile, uploadState.uploadedFile?.path)
    }
  }, [selectedFile, onFileProcess, uploadState.uploadedFile])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const currentError = error || validationError || uploadState.error
  const isUploading = uploadState.isUploading
  const isUploaded = uploadState.uploadedFile !== null
  const currentProgress = isUploading ? uploadState.uploadProgress : progress

  return (
    <div className={`${styles.fileUploader} ${className}`}>
      {/* Toast de procesamiento */}
      <AnimatePresence>
        {showProcessingToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className={styles.processingToast}
          >
            <div className={styles.toastContent}>
              <div className={styles.spinningIcon}>
                <Upload size={24} />
              </div>
              <div className={styles.toastText}>
                <h4>Subiendo archivo...</h4>
                <p>Por favor espera mientras procesamos tu archivo</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast de éxito prominente */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 25
              }
            }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className={styles.successToast}
          >
            <div className={styles.confettiContainer}>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className={styles.confetti}
                  style={{
                    left: `${20 + i * 10}%`,
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]
                  }}
                  initial={{ opacity: 0, y: 0, rotate: 0 }}
                  animate={{ 
                    opacity: [0, 1, 1, 0], 
                    y: [-20, -40, -20, 20],
                    rotate: [0, 180, 360],
                    transition: { 
                      duration: 2, 
                      delay: i * 0.1,
                      ease: "easeOut"
                    }
                  }}
                />
              ))}
            </div>
            <div className={styles.toastContent}>
              <motion.div 
                className={styles.successIconWrapper}
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ 
                  duration: 0.6,
                  ease: "easeInOut"
                }}
              >
                <CheckCircle size={32} />
                <Sparkles className={styles.sparkleIcon} size={16} />
              </motion.div>
              <div className={styles.toastText}>
                <h4>¡Archivo subido exitosamente!</h4>
                <p>Tu archivo Excel está listo para ser procesado</p>
              </div>
            </div>
            <motion.button
              onClick={() => setShowSuccessToast(false)}
              className={styles.toastCloseButton}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={16} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className={`${styles.dropZone} ${isDragOver ? styles.dragOver : ''} ${currentError ? styles.error : ''} ${(isProcessing || isUploading) ? styles.processing : ''} ${isUploaded ? styles.uploaded : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        whileHover={!isProcessing && !isUploading ? { scale: 1.01 } : {}}
        whileTap={!isProcessing && !isUploading ? { scale: 0.99 } : {}}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleInputChange}
          className={styles.hiddenInput}
          disabled={isProcessing || isUploading}
        />
        
        <AnimatePresence mode="wait">
          {!selectedFile ? (
            <motion.div
              key="upload-prompt"
              className={styles.uploadContent}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <motion.div 
                className={styles.uploadIcon}
                whileHover={{ 
                  scale: 1.1, 
                  rotate: 5,
                  transition: { type: "spring", stiffness: 300 }
                }}
              >
                <Upload size={32} />
              </motion.div>
              <h3 className={styles.uploadTitle}>CARGAR ARCHIVO</h3>
              <p className={styles.uploadDescription}>
                {autoUpload ? 'Selecciona tu archivo - se subirá automáticamente' : 'Selecciona tu archivo de datos'}
              </p>
              <p className={styles.uploadFormats}>Formatos soportados: .xlsx, .csv</p>
            </motion.div>
          ) : (
            <motion.div
              key="file-selected"
              className={styles.fileSelected}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <motion.div 
                className={styles.fileIcon}
                animate={isUploaded ? {
                  scale: [1, 1.2, 1],
                  transition: { duration: 0.5 }
                } : {}}
              >
                {isUploaded ? (
                  <FileCheck size={32} color="#10b981" />
                ) : (
                  <File size={32} />
                )}
              </motion.div>
              <div className={styles.fileInfo}>
                <h4 className={styles.fileName}>{selectedFile.name}</h4>
                <p className={styles.fileSize}>
                  {formatFileSize(selectedFile.size)}
                  {isUploaded && (
                    <motion.span 
                      className={styles.uploadedBadge}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                    >
                      ✓ Subido a la nube
                    </motion.span>
                  )}
                </p>
              </div>
              {!isProcessing && !isUploading && (
                <motion.button
                  onClick={handleRemoveFile}
                  className={styles.removeButton}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={16} />
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Progress Bar mejorado */}
      <AnimatePresence>
        {(isProcessing || isUploading) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={styles.progressContainer}
          >
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>
                {isUploading ? "Subiendo archivo..." : "Procesando archivo..."}
              </span>
              <span className={styles.progressPercentage}>
                {Math.round(currentProgress)}%
              </span>
            </div>
            <ProgressBar
              progress={currentProgress}
              variant="primary"
              animated
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message mejorado */}
      <AnimatePresence>
        {currentError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={styles.errorMessage}
          >
            <motion.div
              animate={{ 
                x: [-2, 2, -2, 2, 0],
                transition: { duration: 0.5 }
              }}
              className={styles.errorIcon}
            >
              <AlertCircle size={20} />
            </motion.div>
            <span>{currentError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message en línea mejorado */}
      <AnimatePresence>
        {isUploaded && !currentError && !showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={styles.successMessage}
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                transition: { duration: 0.6, repeat: Infinity, repeatDelay: 2 }
              }}
              className={styles.successIcon}
            >
              <CheckCircle size={20} />
            </motion.div>
            <span>Archivo subido correctamente a la nube</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Estados del procesamiento */}
      <AnimatePresence mode="wait">
        {selectedFile && isUploaded && !hasBeenProcessed && (
          <motion.div
            key="process-button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <motion.button
              onClick={handleProcessFile}
              disabled={isProcessing}
              className={`${styles.processButton} ${isProcessing ? styles.processing : ''} ${processingComplete ? styles.completed : ''}`}
              whileHover={!isProcessing ? { 
                scale: 1.05,
                boxShadow: "0 10px 30px rgba(59, 130, 246, 0.3)"
              } : {}}
              whileTap={!isProcessing ? { scale: 0.95 } : {}}
              animate={processingComplete ? {
                scale: [1, 1.1, 1],
                transition: { duration: 0.6 }
              } : {}}
            >
              {isProcessing ? (
                <>
                  <motion.div
                    className={styles.processingSpinner}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Upload size={20} />
                  </motion.div>
                  PROCESANDO CON IA...
                </>
              ) : processingComplete ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    <CheckCircle size={20} className={styles.buttonIcon} />
                  </motion.div>
                  ¡PROCESADO CON IA!
                </>
              ) : (
                <>
                  <Sparkles size={20} className={styles.buttonIcon} />
                  PROCESAR CON IA
                </>
              )}
            </motion.button>
          </motion.div>
        )}

        {/* Estado completado permanente */}
        {selectedFile && isUploaded && hasBeenProcessed && (
          <motion.div
            key="completed-state"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={styles.completedContainer}
          >
            <motion.div
              className={styles.completedMessage}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <motion.div
                className={styles.completedIcon}
                animate={{ 
                  scale: [1, 1.1, 1],
                  transition: { duration: 2, repeat: Infinity, repeatDelay: 3 }
                }}
              >
                <CheckCircle size={24} />
              </motion.div>
              <div className={styles.completedText}>
                <h4>✅ Archivo procesado con IA</h4>
                <p>Los datos han sido analizados exitosamente</p>
              </div>
            </motion.div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '12px' }}>
              <motion.button
                onClick={handleProcessAgain}
                className={styles.processAgainButton}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                🔄 Procesar de nuevo
              </motion.button>
              
              <motion.button
                onClick={() => {
                  // Reset completo para subir nuevo archivo
                  setSelectedFile(null)
                  setValidationError(null)
                  setShowSuccessToast(false)
                  setShowProcessingToast(false)
                  setProcessingComplete(false)
                  setHasBeenProcessed(false)
                  resetUpload()
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                className={styles.processAgainButton}
                style={{ backgroundColor: '#22c55e' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                📁 Subir nuevo archivo
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {(isProcessing || isUploading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.processingOverlay}
          >
            <LoadingSpinner size="medium" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FileUploader