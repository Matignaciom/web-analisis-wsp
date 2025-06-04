import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/presentation/store/useAppStore'
import { InMemoryConversationRepository } from '@/infrastructure/services'

export const useConversationUpdater = () => {
  const { conversations, updateConversation } = useAppStore()
  const lastUpdateRef = useRef<number>(0)
  const conversationCacheRef = useRef<Map<string, any>>(new Map())
  const repositoryRef = useRef<InMemoryConversationRepository | undefined>(undefined)

  // Inicializar repositorio una sola vez
  const getRepository = useCallback(() => {
    if (!repositoryRef.current) {
      if (typeof window !== 'undefined' && (window as any).__conversationRepository) {
        repositoryRef.current = (window as any).__conversationRepository
        console.log('♻️ Usando repositorio compartido desde window')
      } else {
        repositoryRef.current = new InMemoryConversationRepository()
        console.log('🆕 Creando nueva instancia del repositorio')
      }
    }
    return repositoryRef.current
  }, [])

  // Verificación optimizada con debounce
  const checkForUpdates = useCallback(async () => {
    const now = Date.now()
    
    // Debounce: no verificar más de una vez por segundo
    if (now - lastUpdateRef.current < 1000) {
      return
    }
    lastUpdateRef.current = now

    try {
      const conversationRepository = getRepository()
      if (!conversationRepository) {
        console.error('❌ Repositorio no disponible')
        return
      }
      
      const updatedConversations = await conversationRepository.getAll()
      
      let updatesFound = 0
      const batchUpdates: Array<{ id: string; updates: any }> = []
      
      // Solo verificar conversaciones que realmente necesitan actualización
      const conversationsToCheck = conversations.filter(conv => 
        !conv.aiSummary || 
        conv.aiSummary.includes('Generando') ||
        !conv.aiSuggestion || 
        conv.aiSuggestion.includes('Analizando') ||
        !conv.interest || 
        !conv.salesPotential
      )

      for (const conv of conversationsToCheck) {
        const updatedConv = updatedConversations.find(u => u.id === conv.id)
        if (!updatedConv) continue

        // Usar cache para evitar comparaciones innecesarias
        const cacheKey = `${conv.id}-${updatedConv.lastMessage}`
        const cached = conversationCacheRef.current.get(cacheKey)
        
        if (cached && 
            cached.aiSummary === updatedConv.aiSummary &&
            cached.aiSuggestion === updatedConv.aiSuggestion &&
            cached.interest === updatedConv.interest &&
            cached.salesPotential === updatedConv.salesPotential) {
          continue // Sin cambios
        }

        // Verificar cambios reales en IA
        const hasAIUpdates = 
          updatedConv.aiSummary !== conv.aiSummary ||
          updatedConv.aiSuggestion !== conv.aiSuggestion ||
          updatedConv.interest !== conv.interest ||
          updatedConv.salesPotential !== conv.salesPotential

        if (hasAIUpdates) {
          updatesFound++
          batchUpdates.push({ id: updatedConv.id, updates: updatedConv })
          
          // Actualizar cache
          conversationCacheRef.current.set(cacheKey, {
            aiSummary: updatedConv.aiSummary,
            aiSuggestion: updatedConv.aiSuggestion,
            interest: updatedConv.interest,
            salesPotential: updatedConv.salesPotential
          })
        }
      }
      
      // Aplicar actualizaciones en batch para reducir re-renders
      if (batchUpdates.length > 0) {
        console.log(`✅ Aplicando ${batchUpdates.length} actualizaciones de IA`)
        batchUpdates.forEach(({ id, updates }) => {
          updateConversation(id, updates)
        })
      }
        
    } catch (error) {
      console.error('❌ Error verificando actualizaciones:', error)
    }
  }, [conversations, updateConversation, getRepository])

  useEffect(() => {
    // Solo verificar si hay conversaciones que necesitan análisis
    const hasIncompleteAnalysis = conversations.some(conv => 
      !conv.aiSummary || 
      conv.aiSummary.includes('Generando') ||
      !conv.aiSuggestion || 
      conv.aiSuggestion.includes('Analizando') ||
      !conv.interest || 
      !conv.salesPotential
    )

    if (!hasIncompleteAnalysis || conversations.length === 0) {
      console.log('✅ Todos los análisis están completos')
      return
    }

    console.log('⏰ Iniciando verificaciones optimizadas cada 5 segundos...')
    
    // Reducir frecuencia a 5 segundos para menos carga
    const interval = setInterval(checkForUpdates, 5000)
    
    // Verificar inmediatamente pero sin bloquear
    setTimeout(checkForUpdates, 100)
    
    return () => {
      console.log('🛑 Deteniendo verificaciones')
      clearInterval(interval)
    }
  }, [conversations.length, checkForUpdates]) // Dependencia más específica

  // Limpiar cache cuando no hay conversaciones
  useEffect(() => {
    if (conversations.length === 0) {
      conversationCacheRef.current.clear()
    }
  }, [conversations.length])
}

export default useConversationUpdater 