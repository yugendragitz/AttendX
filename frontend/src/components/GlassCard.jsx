import { motion } from 'framer-motion'
import { useRef, useState } from 'react'

// Glassmorphism card component with 3D tilt effect
export default function GlassCard({ 
  children, 
  className = '', 
  hover = true,
  glow = false,
  onClick = null 
}) {
  const cardRef = useRef(null)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)

  // Handle mouse movement for 3D tilt effect
  const handleMouseMove = (e) => {
    if (!cardRef.current || !hover) return
    
    const card = cardRef.current
    const rect = card.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const mouseX = e.clientX - centerX
    const mouseY = e.clientY - centerY
    
    // Calculate rotation (max 10 degrees)
    const rotationX = (mouseY / (rect.height / 2)) * -8
    const rotationY = (mouseX / (rect.width / 2)) * 8
    
    setRotateX(rotationX)
    setRotateY(rotationY)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
  }

  return (
    <motion.div
      ref={cardRef}
      className={`
        relative overflow-hidden rounded-2xl
        bg-white/5 backdrop-blur-xl
        border border-white/10
        ${glow ? 'neon-glow' : ''}
        ${hover ? 'card-hover' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: 'transform 0.1s ease-out',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Gradient border overlay */}
      <div className="absolute inset-0 rounded-2xl p-[1px] pointer-events-none">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-neon-purple/20 via-transparent to-neon-cyan/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      
      {/* Shine effect on hover */}
      <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  )
}
