import { motion } from 'framer-motion'

// Skeleton loader for cards
export function CardSkeleton() {
  return (
    <div className="rounded-2xl p-6 glass animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 w-20 skeleton rounded mb-3" />
          <div className="h-6 w-32 skeleton rounded mb-2" />
          <div className="h-4 w-24 skeleton rounded" />
        </div>
        <div className="w-24 h-24 skeleton rounded-full" />
      </div>
    </div>
  )
}

// Skeleton loader for chart
export function ChartSkeleton() {
  return (
    <div className="rounded-2xl p-6 glass animate-pulse">
      <div className="h-6 w-48 skeleton rounded mb-6" />
      <div className="flex items-end justify-around h-48 gap-4">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i}
            className="skeleton rounded-t-lg"
            style={{ 
              width: '15%', 
              height: `${Math.random() * 60 + 40}%` 
            }}
          />
        ))}
      </div>
    </div>
  )
}

// Skeleton loader for stats
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass rounded-xl p-4 animate-pulse">
          <div className="h-4 w-16 skeleton rounded mx-auto mb-2" />
          <div className="h-8 w-12 skeleton rounded mx-auto" />
        </div>
      ))}
    </div>
  )
}

// Full dashboard skeleton
export function DashboardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-6"
    >
      {/* Header skeleton */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="h-8 w-64 skeleton rounded mb-2" />
          <div className="h-4 w-48 skeleton rounded" />
        </div>
        <div className="flex gap-4">
          <div className="w-10 h-10 skeleton rounded-xl" />
          <div className="w-32 h-10 skeleton rounded-xl" />
        </div>
      </div>

      {/* Stats skeleton */}
      <StatsSkeleton />

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {[...Array(6)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </motion.div>
  )
}

// Loading spinner
export function LoadingSpinner({ size = 'md', text = '' }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`${sizeClasses[size]} relative`}>
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-white/10" />
        {/* Spinning gradient ring */}
        <div 
          className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
          style={{
            borderTopColor: '#a855f7',
            borderRightColor: '#3b82f6',
          }}
        />
        {/* Inner glow */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-neon-purple/20 to-neon-cyan/20 animate-pulse" />
      </div>
      {text && (
        <motion.p 
          className="text-gray-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}

// Login loading overlay with animated messages
export function LoginLoadingOverlay({ message = 'Fetching your attendance...' }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass rounded-2xl p-8 text-center max-w-sm"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* Animated logo/spinner */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          {/* Outer spinning ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-transparent"
            style={{
              borderTopColor: '#a855f7',
              borderRightColor: '#06b6d4',
            }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          />
          {/* Inner pulsing glow */}
          <motion.div
            className="absolute inset-3 rounded-full bg-gradient-to-br from-neon-purple/30 to-neon-cyan/30"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
        </div>
        
        {/* Message */}
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <p className="text-white font-semibold text-lg">{message}</p>
          <p className="text-gray-400 text-sm">Please wait...</p>
        </motion.div>
        
        {/* Animated progress bar */}
        <div className="mt-6 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-neon-purple via-neon-blue to-neon-cyan"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ 
              repeat: Infinity, 
              duration: 1.2, 
              ease: 'easeInOut' 
            }}
          />
        </div>
        
        {/* Speed tip */}
        <p className="text-xs text-gray-500 mt-4">
          ⚡ Jet-speed fetching enabled
        </p>
      </motion.div>
    </motion.div>
  )
}
