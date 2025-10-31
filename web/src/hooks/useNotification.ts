import { useUIStore } from '@store/uiStore'

/**
 * useNotification
 * Toast/notification management via UI store.
 *
 * Example: const { addNotification } = useNotification()
 */
export function useNotification() {
  const notifications = useUIStore((s) => s.getNotifications())
  const addNotification = useUIStore((s) => s.addNotification)
  const removeNotification = useUIStore((s) => s.removeNotification)
  return { notifications, addNotification, removeNotification }
}


