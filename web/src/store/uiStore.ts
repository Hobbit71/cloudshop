import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export type Notification = { id: string; message: string; type?: 'info' | 'success' | 'error' } 

type UIState = {
  modals: Record<string, boolean>
  notifications: Notification[]
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  openModal: (id: string) => void
  closeModal: (id: string) => void
  addNotification: (n: Omit<Notification, 'id'>) => string
  removeNotification: (id: string) => void
  setTheme: (t: 'light' | 'dark') => void
  activeModals: () => string[]
  getNotifications: () => Notification[]
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      immer((set, get) => ({
        modals: {},
        notifications: [],
        sidebarOpen: false,
        theme: 'light',
        openModal: (id) => set((s) => { s.modals[id] = true }),
        closeModal: (id) => set((s) => { s.modals[id] = false }),
        addNotification: (n) => {
          const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`
          set((s) => { s.notifications.push({ id, ...n }) })
          return id
        },
        removeNotification: (id) => set((s) => { s.notifications = s.notifications.filter((x) => x.id !== id) }),
        setTheme: (t) => set((s) => { s.theme = t }),
        activeModals: () => Object.entries(get().modals).filter(([, v]) => v).map(([k]) => k),
        getNotifications: () => get().notifications
      })),
      { name: 'cloudshop.ui', partialize: (s) => ({ theme: s.theme, sidebarOpen: s.sidebarOpen }) }
    ),
    { name: 'uiStore' }
  )
)


