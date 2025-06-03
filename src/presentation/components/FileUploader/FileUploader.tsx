import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, File, X, CheckCircle, AlertCircle, Cloud } from 'lucide-react'
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
    onFileSelect?.(file)

    // Si autoUpload está habilitado, subir automáticamente a Supabase
    if (autoUpload) {
      try {
        const uploadResult = await uploadFile(file)
        if (uploadResult.success && uploadResult.path) {
          onUploadComplete?.(uploadResult.path, file.name)
        }
      } catch (error) {
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
    resetUpload()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [resetUpload])

  const handleProcessFile = useCallback(() => {
    if (selectedFile) {
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
      <motion.div
        className={`${styles.dropZone} ${isDragOver ? styles.dragOver : ''} ${currentError ? styles.error : ''} ${(isProcessing || isUploading) ? styles.processing : ''}`}
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
              <div className={styles.uploadIcon}>
                <Upload size={32} />
              </div>
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
              <div className={styles.fileIcon}>
                {isUploaded ? (
                  <Cloud size={32} color="#10b981" />
                ) : (
                  <File size={32} />
                )}
              </div>
              <div className={styles.fileInfo}>
                <h4 className={styles.fileName}>{selectedFile.name}</h4>
                <p className={styles.fileSize}>
                  {formatFileSize(selectedFile.size)}
                  {isUploaded && <span style={{ color: '#10b981', marginLeft: '8px' }}>✓ Subido</span>}
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

      {/* Progress Bar */}
      <AnimatePresence>
        {(isProcessing || isUploading) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={styles.progressContainer}
          >
            <ProgressBar
              progress={currentProgress}
              label={isUploading ? "Subiendo archivo..." : "Procesando archivo..."}
              variant="primary"
              animated
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {currentError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={styles.errorMessage}
          >
            <AlertCircle size={16} className={styles.errorIcon} />
            <span>{currentError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {isUploaded && !currentError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={styles.successMessage}
          >
            <CheckCircle size={16} className={styles.successIcon} />
            <span>Archivo subido correctamente a la nube</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Process Button */}
      <AnimatePresence>
        {selectedFile && isUploaded && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <motion.button
              onClick={handleProcessFile}
              className={styles.processButton}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              PROCESAR CON IA
            </motion.button>
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