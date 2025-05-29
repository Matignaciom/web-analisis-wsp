import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'
import LoadingSpinner from '../common/LoadingSpinner'
import ProgressBar from '../common/ProgressBar'
import styles from './FileUploader.module.css'

interface FileUploaderProps {
  onFileSelect?: (file: File) => void
  onFileProcess?: () => void
  acceptedFormats?: string[]
  maxSizeInMB?: number
  isProcessing?: boolean
  progress?: number
  error?: string | null
  className?: string
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  onFileProcess,
  acceptedFormats = ['.xlsx', '.csv'],
  maxSizeInMB = 25,
  isProcessing = false,
  progress = 0,
  error,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileSelect = useCallback((file: File) => {
    const validation = validateFile(file)
    if (!validation.isValid) {
      setValidationError(validation.error || 'Archivo inválido')
      return
    }

    setSelectedFile(file)
    setValidationError(null)
    onFileSelect?.(file)
  }, [validateFile, onFileSelect])

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
    if (!isProcessing) {
      fileInputRef.current?.click()
    }
  }, [isProcessing])

  const handleRemoveFile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedFile(null)
    setValidationError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const currentError = error || validationError

  return (
    <div className={`${styles.fileUploader} ${className}`}>
      <motion.div
        className={`${styles.dropZone} ${isDragOver ? styles.dragOver : ''} ${currentError ? styles.error : ''} ${isProcessing ? styles.processing : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        whileHover={!isProcessing ? { scale: 1.01 } : {}}
        whileTap={!isProcessing ? { scale: 0.99 } : {}}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleInputChange}
          className={styles.hiddenInput}
          disabled={isProcessing}
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
              <Upload className={styles.uploadIcon} size={48} />
              <h3 className={styles.uploadTitle}>Cargar archivo de datos</h3>
              <p className={styles.uploadDescription}>
                Arrastra y suelta tu archivo aquí o haz clic para seleccionar
              </p>
              <p className={styles.uploadFormats}>
                Formatos: {acceptedFormats.join(', ')} • Máx. {maxSizeInMB}MB
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="file-selected"
              className={styles.fileSelected}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <File className={styles.fileIcon} size={32} />
              <div className={styles.fileInfo}>
                <h4 className={styles.fileName}>{selectedFile.name}</h4>
                <p className={styles.fileSize}>
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              {!isProcessing && (
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
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={styles.progressContainer}
          >
            <ProgressBar
              progress={progress}
              label="Procesando archivo..."
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
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={styles.errorMessage}
          >
            <AlertCircle className={styles.errorIcon} size={16} />
            {currentError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {selectedFile && !currentError && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={styles.successMessage}
          >
            <CheckCircle className={styles.successIcon} size={16} />
            Archivo cargado correctamente. 
            {onFileProcess && (
              <motion.button
                onClick={onFileProcess}
                className={styles.processButton}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Procesar con IA
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing State */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.processingOverlay}
          >
            <LoadingSpinner size="medium" text="Analizando datos..." />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FileUploader 