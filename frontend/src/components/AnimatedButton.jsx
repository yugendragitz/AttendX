import { useState, useRef } from 'react'
import { motion } from 'framer-motion'

// Animated button with ripple effect
export default function AnimatedButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary', // primary, secondary, ghost
  size = 'md', // sm, md, lg
  className = '',
  fullWidth = false,
  type = 'button',
}) {
  const [ripples, setRipples] = useState([])
  const buttonRef = useRef(null)

  // Create ripple effect on click
  const createRipple = (e) => {
    if (disabled || loading) return

    const button = buttonRef.current
    const rect = button.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const size = Math.max(rect.width, rect.height) * 2

    const newRipple = {
      id: Date.now(),
      x: x - size / 2,
      y: y - size / 2,
      size,
    }

    setRipples((prev) => [...prev, newRipple])

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id))
    }, 600)
  }

  const handleClick = (e) => {
    createRipple(e)
    if (onClick && !disabled && !loading) {
      onClick(e)
    }
  }

  // Size classes
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  // Variant classes
  const variantClasses = {
    primary: `
      bg-gradient-to-r from-neon-purple via-neon-blue to-neon-cyan
      hover:from-neon-purple/90 hover:via-neon-blue/90 hover:to-neon-cyan/90
      text-white font-semibold
      shadow-lg shadow-neon-purple/25
      hover:shadow-xl hover:shadow-neon-purple/40
    `,
    secondary: `
      bg-white/10 hover:bg-white/20
      border border-white/20 hover:border-white/40
      text-white font-medium
      backdrop-blur-sm
    `,
    ghost: `
      bg-transparent hover:bg-white/10
      text-white font-medium
    `,
  }

  return (
    <motion.button
      ref={buttonRef}
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      className={`
        relative overflow-hidden rounded-xl
        transition-all duration-300 ease-out
        transform active:scale-[0.98]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}

      {/* Animated glow effect */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-r from-neon-purple/0 via-white/20 to-neon-cyan/0"
        initial={{ x: '-100%', opacity: 0 }}
        whileHover={{ x: '100%', opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />

      {/* Button content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </span>
    </motion.button>
  )
}
