import { motion, AnimatePresence } from 'framer-motion'
import { HiCheckCircle, HiXCircle, HiInformationCircle, HiExclamation } from 'react-icons/hi'
import { useToast } from '../hooks/useToast.jsx'

// Toast notification icons
const icons = {
  success: HiCheckCircle,
  error: HiXCircle,
  info: HiInformationCircle,
  warning: HiExclamation,
}

// Toast notification colors
const colors = {
  success: {
    bg: 'from-green-500/20 to-green-600/10',
    border: 'border-green-500/30',
    icon: 'text-green-400',
  },
  error: {
    bg: 'from-red-500/20 to-red-600/10',
    border: 'border-red-500/30',
    icon: 'text-red-400',
  },
  info: {
    bg: 'from-blue-500/20 to-blue-600/10',
    border: 'border-blue-500/30',
    icon: 'text-blue-400',
  },
  warning: {
    bg: 'from-yellow-500/20 to-yellow-600/10',
    border: 'border-yellow-500/30',
    icon: 'text-yellow-400',
  },
}

// Single toast component
function Toast({ toast, onDismiss }) {
  const { id, type, message, title } = toast
  const Icon = icons[type]
  const colorClass = colors[type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`
        relative overflow-hidden rounded-xl p-4 pr-12
        bg-gradient-to-r ${colorClass.bg}
        border ${colorClass.border}
        backdrop-blur-xl shadow-lg
        max-w-sm w-full
      `}
    >
      {/* Progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-white/30 to-white/10"
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 5, ease: 'linear' }}
        onAnimationComplete={() => onDismiss(id)}
      />

      <div className="flex gap-3">
        <Icon className={`w-6 h-6 ${colorClass.icon} flex-shrink-0`} />
        <div>
          {title && (
            <p className="text-white font-semibold text-sm">{title}</p>
          )}
          <p className="text-gray-300 text-sm">{message}</p>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={() => onDismiss(id)}
        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
      >
        <HiXCircle className="w-5 h-5" />
      </button>
    </motion.div>
  )
}

// Toast container - renders all active toasts
export default function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-6 right-6 z-toast space-y-3">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  )
}
