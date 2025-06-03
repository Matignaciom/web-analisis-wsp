import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { exportService, type ExportData, type ExportOptions } from '@/infrastructure/services/ExportService'

interface UseExportReturn {
  isExporting: boolean
  exportToPDF: (data: ExportData, options?: ExportOptions) => Promise<void>
  exportToExcel: (data: ExportData, options?: ExportOptions) => Promise<void>
  error: string | null
}

export const useExport = (): UseExportReturn => {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const downloadFile = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportToPDF = useCallback(async (data: ExportData, options: ExportOptions = {}) => {
    setIsExporting(true)
    setError(null)

    try {
      const loadingToast = toast.loading('Generando reporte PDF...', {
        icon: '📄'
      })

      const blob = await exportService.exportToPDF(data, options)
      const filename = `reporte-whatsapp-${new Date().toISOString().split('T')[0]}.pdf`
      
      downloadFile(blob, filename)
      
      toast.success(`PDF exportado exitosamente: ${filename}`, {
        id: loadingToast,
        icon: '✅'
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al exportar PDF'
      setError(errorMessage)
      toast.error(`Error al exportar PDF: ${errorMessage}`, {
        icon: '❌'
      })
    } finally {
      setIsExporting(false)
    }
  }, [downloadFile])

  const exportToExcel = useCallback(async (data: ExportData, options: ExportOptions = {}) => {
    setIsExporting(true)
    setError(null)

    try {
      const loadingToast = toast.loading('Generando archivo Excel...', {
        icon: '📊'
      })

      const blob = await exportService.exportToExcel(data, options)
      const filename = `analisis-whatsapp-${new Date().toISOString().split('T')[0]}.xlsx`
      
      downloadFile(blob, filename)
      
      toast.success(`Excel exportado exitosamente: ${filename}`, {
        id: loadingToast,
        icon: '✅'
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al exportar Excel'
      setError(errorMessage)
      toast.error(`Error al exportar Excel: ${errorMessage}`, {
        icon: '❌'
      })
    } finally {
      setIsExporting(false)
    }
  }, [downloadFile])

  return {
    isExporting,
    exportToPDF,
    exportToExcel,
    error
  }
} 