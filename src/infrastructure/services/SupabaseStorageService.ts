import { supabase, EXCEL_FILES_BUCKET } from '../config/supabaseClient'

export interface UploadResultSuccess {
  success: true
  path: string
  fileId: string
  url?: string
}

export interface UploadResultError {
  success: false
  error: string
}

export type UploadResult = UploadResultSuccess | UploadResultError

export interface FileMetadata {
  name: string
  size: number
  type: string
  uploadedAt: Date
  path: string
}

export class SupabaseStorageService {
  
  /**
   * Sube un archivo Excel a Supabase Storage
   */
  async uploadFile(file: File): Promise<UploadResult> {
    try {
      // Validar tipo de archivo
      if (!this.isValidFileType(file)) {
        return {
          success: false,
          error: 'Tipo de archivo no válido. Solo se permiten archivos Excel (.xlsx, .xls) y CSV.'
        }
      }

      // Validar tamaño de archivo
      const maxSize = 25 * 1024 * 1024 // 25MB
      if (file.size > maxSize) {
        return {
          success: false,
          error: 'El archivo es demasiado grande. El tamaño máximo permitido es 25MB.'
        }
      }

      // Generar nombre único para el archivo
      const timestamp = new Date().getTime()
      const fileName = `${timestamp}_${this.sanitizeFileName(file.name)}`
      const filePath = `uploads/${fileName}`

      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from(EXCEL_FILES_BUCKET)
        .upload(filePath, file, {
          upsert: false, // No sobrescribir archivos existentes
          contentType: file.type
        })

      if (error) {
        console.error('Error uploading file to Supabase:', error)
        return {
          success: false,
          error: `Error al subir archivo: ${error.message}`
        }
      }

      if (!data.path) {
        return {
          success: false,
          error: 'Error: no se recibió la ruta del archivo subido'
        }
      }

      // Obtener URL pública del archivo (si el bucket es público)
      // Como nuestro bucket es privado, no obtenemos URL pública por seguridad
      
      return {
        success: true,
        path: data.path,
        fileId: data.id || timestamp.toString()
      }

    } catch (error) {
      console.error('Unexpected error in uploadFile:', error)
      return {
        success: false,
        error: 'Error inesperado al subir el archivo. Por favor, inténtalo de nuevo.'
      }
    }
  }

  /**
   * Descarga un archivo desde Supabase Storage
   */
  async downloadFile(filePath: string): Promise<Blob | null> {
    try {
      const { data, error } = await supabase.storage
        .from(EXCEL_FILES_BUCKET)
        .download(filePath)

      if (error) {
        console.error('Error downloading file from Supabase:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Unexpected error downloading file:', error)
      return null
    }
  }

  /**
   * Elimina un archivo de Supabase Storage
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(EXCEL_FILES_BUCKET)
        .remove([filePath])

      if (error) {
        console.error('Error deleting file from Supabase:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Unexpected error deleting file:', error)
      return false
    }
  }

  /**
   * Lista archivos subidos
   */
  async listFiles(path: string = 'uploads'): Promise<FileMetadata[]> {
    try {
      const { data, error } = await supabase.storage
        .from(EXCEL_FILES_BUCKET)
        .list(path, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) {
        console.error('Error listing files from Supabase:', error)
        return []
      }

      return data.map(file => ({
        name: file.name,
        size: file.metadata?.size || 0,
        type: file.metadata?.mimetype || 'unknown',
        uploadedAt: new Date(file.created_at),
        path: `${path}/${file.name}`
      }))

    } catch (error) {
      console.error('Unexpected error listing files:', error)
      return []
    }
  }

  /**
   * Verifica si el tipo de archivo es válido
   */
  private isValidFileType(file: File): boolean {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/csv'
    ]

    const validExtensions = ['.xlsx', '.xls', '.csv']
    const fileExtension = this.getFileExtension(file.name).toLowerCase()

    return validTypes.includes(file.type) || validExtensions.includes(fileExtension)
  }

  /**
   * Obtiene la extensión del archivo
   */
  private getFileExtension(fileName: string): string {
    return fileName.slice(fileName.lastIndexOf('.'))
  }

  /**
   * Sanitiza el nombre del archivo para evitar caracteres problemáticos
   */
  private sanitizeFileName(fileName: string): string {
    // Remover caracteres especiales y espacios
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .slice(0, 100) // Limitar longitud
  }

  /**
   * Obtiene información del bucket
   */
  async getBucketInfo(): Promise<{ exists: boolean; isPublic: boolean }> {
    try {
      const { data, error } = await supabase.storage.getBucket(EXCEL_FILES_BUCKET)
      
      if (error) {
        return { exists: false, isPublic: false }
      }

      return {
        exists: true,
        isPublic: data.public || false
      }
    } catch (error) {
      return { exists: false, isPublic: false }
    }
  }
} 