export interface SupabaseFileUpload {
  bucket: string
  path: string
  name: string
  size: number
  contentType: string
  uploadedAt: Date
}

export interface SupabaseError {
  message: string
  details?: string
  hint?: string
  code?: string
}

export interface SupabaseStorageResponse<T = any> {
  data: T | null
  error: SupabaseError | null
}

export interface StorageBucketConfig {
  id: string
  name: string
  public: boolean
  allowedMimeTypes?: string[]
  fileSizeLimit?: number
}

export interface FileUploadOptions {
  bucket: string
  path: string
  upsert?: boolean
  contentType?: string
}

export interface FileListOptions {
  limit?: number
  offset?: number
  sortBy?: {
    column: 'name' | 'id' | 'updated_at' | 'created_at' | 'last_accessed_at'
    order: 'asc' | 'desc'
  }
}

export interface FileObject {
  name: string
  id?: string
  updated_at?: string
  created_at: string
  last_accessed_at?: string
  metadata?: {
    eTag?: string
    size?: number
    mimetype?: string
    cacheControl?: string
    lastModified?: string
    contentLength?: number
    httpStatusCode?: number
  }
}

export interface SupabaseConfig {
  url: string
  anonKey: string
  serviceKey?: string
} 