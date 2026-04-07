import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

// Animated circular progress component
export default function CircularProgress({
  percentage,
  size = 120,
  strokeWidth = 8,
  animated = true,
  showPercentage = true,
  label = '',
}) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0)
  
  // Calculate dimensions
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (animatedPercentage / 100) * circumference

  // Determine color based on percentage
  const getColor = () => {
    if (percentage >= 75) return { primary: '#22c55e', secondary: '#16a34a' } // Green
    if (percentage >= 60) return { primary: '#eab308', secondary: '#ca8a04' } // Yellow
    return { primary: '#ef4444', secondary: '#dc2626' } // Red
  }

  const colors = getColor()

  // Animate percentage on mount
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedPercentage(percentage)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setAnimatedPercentage(percentage)
    }
  }, [percentage, animated])

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className="progress-ring"
        width={size}
        height={size}
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id={`gradient-${percentage}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.secondary} />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id={`glow-${percentage}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background circle */}
        <circle
          className="opacity-20"
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />

        {/* Progress circle */}
        <motion.circle
          className="progress-ring-circle"
          stroke={`url(#gradient-${percentage})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          filter={`url(#glow-${percentage})`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />

        {/* Animated dot at the end of progress */}
        <motion.circle
          r={strokeWidth / 2}
          fill={colors.primary}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.3 }}
          style={{
            cx: size / 2 + radius * Math.cos((animatedPercentage / 100) * Math.PI * 2 - Math.PI / 2),
            cy: size / 2 + radius * Math.sin((animatedPercentage / 100) * Math.PI * 2 - Math.PI / 2),
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <motion.span
            className="text-2xl font-bold"
            style={{ color: colors.primary }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5, type: 'spring' }}
          >
            {Math.round(animatedPercentage)}%
          </motion.span>
        )}
        {label && (
          <motion.span
            className="text-xs text-gray-400 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.3 }}
          >
            {label}
          </motion.span>
        )}
      </div>
    </div>
  )
}
