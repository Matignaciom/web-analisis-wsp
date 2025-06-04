import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { DashboardMetrics } from '@/domain/entities'
import type { Conversation } from '@/domain/entities'

interface AppState {
  // UI State
  isLoading: boolean
  error: string | null
  
  // Dashboard State
  dashboardMetrics: DashboardMetrics | null
  isLoadingMetrics: boolean
  
  // Conversations State
  conversations: Conversation[]
  selectedConversation: Conversation | null
  
  // File Upload State
  uploadProgress: number
  isUploading: boolean
  
  // Theme & Settings
  theme: 'light' | 'dark'
  sidebarCollapsed: boolean
}

interface AppActions {
  // UI Actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Dashboard Actions
  setDashboardMetrics: (metrics: DashboardMetrics | null) => void
  setLoadingMetrics: (loading: boolean) => void
  
  // Conversations Actions
  setConversations: (conversations: Conversation[]) => void
  setSelectedConversation: (conversation: Conversation | null) => void
  addConversation: (conversation: Conversation) => void
  updateConversation: (id: string, updates: Partial<Conversation>) => void
  removeConversation: (id: string) => void
  
  // File Upload Actions
  setUploadProgress: (progress: number) => void
  setUploading: (uploading: boolean) => void
  
  // Theme & Settings Actions
  setTheme: (theme: 'light' | 'dark') => void
  toggleSidebar: () => void
  
  // Reset Actions
  reset: () => void
}

type AppStore = AppState & AppActions

const initialState: AppState = {
  isLoading: false,
  error: null,
  dashboardMetrics: null,
  isLoadingMetrics: false,
  conversations: [],
  selectedConversation: null,
  uploadProgress: 0,
  isUploading: false,
  theme: 'light',
  sidebarCollapsed: false
}

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set) => ({
    ...initialState,
    
    // UI Actions
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    
    // Dashboard Actions
    setDashboardMetrics: (metrics) => set({ dashboardMetrics: metrics }),
    setLoadingMetrics: (loading) => set({ isLoadingMetrics: loading }),
    
    // Conversations Actions
    setConversations: (conversations) => set({ conversations }),
    setSelectedConversation: (conversation) => set({ selectedConversation: conversation }),
    addConversation: (conversation) => 
      set((state) => ({ 
        conversations: [...state.conversations, conversation] 
      })),
    updateConversation: (id, updates) =>
      set((state) => ({
        conversations: state.conversations.map(conv =>
          conv.id === id ? { ...conv, ...updates } : conv
        )
      })),
    removeConversation: (id) =>
      set((state) => ({
        conversations: state.conversations.filter(conv => conv.id !== id),
        selectedConversation: 
          state.selectedConversation?.id === id ? null : state.selectedConversation
      })),
    
    // File Upload Actions
    setUploadProgress: (progress) => set({ uploadProgress: progress }),
    setUploading: (uploading) => set({ isUploading: uploading }),
    
    // Theme & Settings Actions
    setTheme: (theme) => {
      set({ theme })
      // Persist theme in localStorage
      localStorage.setItem('theme', theme)
      // Apply theme to document
      document.documentElement.classList.toggle('dark', theme === 'dark')
    },
    toggleSidebar: () => 
      set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    
    // Reset Actions
    reset: () => set(initialState)
  }))
)

// Selectors para optimizar re-renders
export const useLoadingState = () => useAppStore((state) => state.isLoading)
export const useError = () => useAppStore((state) => state.error)
export const useDashboardMetrics = () => useAppStore((state) => state.dashboardMetrics)
export const useConversations = () => useAppStore((state) => state.conversations)
export const useSelectedConversation = () => useAppStore((state) => state.selectedConversation)
export const useTheme = () => useAppStore((state) => state.theme)
export const useUploadState = () => useAppStore((state) => ({
  progress: state.uploadProgress,
  isUploading: state.isUploading
}))

// Subscribe to theme changes from localStorage
if (typeof window !== 'undefined') {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
  if (savedTheme) {
    useAppStore.getState().setTheme(savedTheme)
  }
} 