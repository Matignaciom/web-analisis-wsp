import { useState, useCallback } from 'react'
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

  const storageService = new SupabaseStorageService()

  const uploadFile = useCallback(async (file: File): Promise<UploadResult> => {
    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      uploadProgress: 0,
      error: null
    }))

    try {
      // Simular progreso de subida (Supabase no proporciona progreso real)
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          uploadProgress: Math.min(prev.uploadProgress + 10, 90)
        }))
      }, 100)

      const result = await storageService.uploadFile(file)
      clearInterval(progressInterval)

      if (result.success) {
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