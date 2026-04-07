import { createContext, useContext, useState, useCallback } from 'react'

// Create toast context
const ToastContext = createContext(null)

// Toast provider component
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  // Add a new toast
  const addToast = useCallback(({ type = 'info', title = '', message, duration = 5000 }) => {
    const id = Date.now() + Math.random()
    
    setToasts((prev) => [...prev, { id, type, title, message }])

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [])

  // Remove a toast by ID
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  // Clear all toasts
  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
    </ToastContext.Provider>
  )
}

// Hook to use toast context
export function useToast() {
  const context = useContext(ToastContext)
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  
  return context
}

export default useToast
