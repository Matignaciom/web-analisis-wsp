import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las credenciales de Supabase. Verifica que VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY estén configuradas en tu archivo .env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Como no usamos autenticación por ahora
    autoRefreshToken: false
  }
})

// Configuración para el bucket de archivos Excel
export const EXCEL_FILES_BUCKET = 'excel-data'

// Función para verificar la conexión con Supabase
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.error('Error connecting to Supabase:', error.message)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error testing Supabase connection:', error)
    return false
  }
} 