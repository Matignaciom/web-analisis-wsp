import { useState, useCallback, useRef } from 'react'
import { ProcessFileUseCase } from '@/application/usecases/ProcessFileUseCase'
import type { ProcessFileResult } from '@/application/usecases/ProcessFileUseCase'

interface UseFileUploadOptions {
  onSuccess?: (result: ProcessFileResult) => void
  onError?: (error: string) => void
  maxSizeInMB?: number
  acceptedFormats?: string[]
}

export const useFileUpload = (
  processFileUseCase: ProcessFileUseCase,
  options: UseFileUploadOptions = {}
) => {
  const {
    onSuccess,
    onError,
    maxSizeInMB = 25,
    acceptedFormats = ['.xlsx', '.csv']
  } = options

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ProcessFileResult | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

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

  const selectFile = useCallback((file: File) => {
    const validation = validateFile(file)
    if (!validation.isValid) {
      setError(validation.error || 'Archivo inválido')
      return false
    }

    setSelectedFile(file)
    setError(null)
    setResult(null)
    return true
  }, [validateFile])

  const processFile = useCallback(async () => {
    if (!selectedFile) {
      setError('No hay archivo seleccionado')
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setError(null)
    abortControllerRef.current = new AbortController()

    try {
      // Simular progreso
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const result = await processFileUseCase.execute(selectedFile)
      
      clearInterval(progressInterval)
      setProgress(100)
      setResult(result)

      if (result.success) {
        onSuccess?.(result)
      } else {
        setError(result.error || 'Error procesando archivo')
        onError?.(result.error || 'Error procesando archivo')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsProcessing(false)
      abortControllerRef.current = null
    }
  }, [selectedFile, processFileUseCase, onSuccess, onError])

  const cancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsProcessing(false)
      setProgress(0)
    }
  }, [])

  const reset = useCallback(() => {
    setSelectedFile(null)
    setError(null)
    setResult(null)
    setProgress(0)
    setIsProcessing(false)
  }, [])

  const removeFile = useCallback(() => {
    setSelectedFile(null)
    setError(null)
    setResult(null)
  }, [])

  return {
    selectedFile,
    isProcessing,
    progress,
    error,
    result,
    selectFile,
    processFile,
    cancelProcessing,
    reset,
    removeFile,
    validateFile
  }
} 