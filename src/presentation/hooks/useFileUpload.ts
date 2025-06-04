import { useState, useCallback, useRef } from 'react'
import { SupabaseStorageService, type UploadResult } from '../../infrastructure/services/SupabaseStorageService'

export interface UploadState {
  isUploading: boolean
  uploadProgress: number
  uploadedFile: {
    path: string
    fileId: string
    name: string
  } | null
  error: string | null
}

export interface UseFileUploadReturn {
  uploadState: UploadState
  uploadFile: (file: File) => Promise<UploadResult>
  resetUpload: () => void
  clearError: () => void
}

export const useFileUpload = (): UseFileUploadReturn => {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    uploadProgress: 0,
    uploadedFile: null,
    error: null
  })

  const progressIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const storageService = new SupabaseStorageService()

  const uploadFile = useCallback(async (file: File): Promise<UploadResult> => {
    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      uploadProgress: 0,
      error: null
    }))

    try {
      // Progreso más optimizado - menos frecuente y más fluido
      let currentProgress = 0
      progressIntervalRef.current = setInterval(() => {
        currentProgress = Math.min(currentProgress + 8, 85) // Incremento más grande, menos frecuente
        setUploadState(prev => ({
          ...prev,
          uploadProgress: currentProgress
        }))
      }, 200) // 200ms en lugar de 100ms para menos carga

      const result = await storageService.uploadFile(file)
      
      // Limpiar intervalo inmediatamente
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = undefined
      }

      if (result.success) {
        // Completar progreso de una vez
        setUploadState(prev => ({
          ...prev,
          isUploading: false,
          uploadProgress: 100,
          uploadedFile: {
            path: result.path,
            fileId: result.fileId,
            name: file.name
          },
          error: null
        }))
      } else {
        setUploadState(prev => ({
          ...prev,
          isUploading: false,
          uploadProgress: 0,
          error: result.error
        }))
      }

      return result

    } catch (error) {
      // Asegurar limpieza del intervalo en caso de error
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = undefined
      }

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        uploadProgress: 0,
        error: 'Error inesperado durante la subida'
      }))

      return {
        success: false,
        error: 'Error inesperado durante la subida'
      }
    }
  }, [])

  const resetUpload = useCallback(() => {
    // Limpiar intervalo si está activo
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = undefined
    }

    setUploadState({
      isUploading: false,
      uploadProgress: 0,
      uploadedFile: null,
      error: null
    })
  }, [])

  const clearError = useCallback(() => {
    setUploadState(prev => ({
      ...prev,
      error: null
    }))
  }, [])

  return {
    uploadState,
    uploadFile,
    resetUpload,
    clearError
  }
} 