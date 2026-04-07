import { motion } from 'framer-motion'
import { HiSun, HiMoon } from 'react-icons/hi'
import { useTheme } from '../hooks/useTheme.jsx'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <motion.button
      onClick={toggleTheme}
      className={`
        relative w-14 h-8 rounded-full p-1
        transition-colors duration-300
        ${isDark 
          ? 'bg-gradient-to-r from-neon-purple/30 to-neon-blue/30 border border-white/20' 
          : 'bg-gradient-to-r from-yellow-400/30 to-orange-400/30 border border-yellow-400/30'}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Toggle knob */}
      <motion.div
        className={`
          w-6 h-6 rounded-full flex items-center justify-center
          ${isDark 
            ? 'bg-gradient-to-br from-neon-purple to-neon-blue' 
            : 'bg-gradient-to-br from-yellow-400 to-orange-400'}
          shadow-lg
        `}
        animate={{ x: isDark ? 0 : 24 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: isDark ? 0 : 180 }}
          transition={{ duration: 0.3 }}
        >
          {isDark ? (
            <HiMoon className="w-4 h-4 text-white" />
          ) : (
            <HiSun className="w-4 h-4 text-white" />
          )}
        </motion.div>
      </motion.div>

      {/* Background icons */}
      <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
        <HiMoon className={`w-3 h-3 ${isDark ? 'text-white/0' : 'text-gray-400'}`} />
        <HiSun className={`w-3 h-3 ${isDark ? 'text-gray-400' : 'text-white/0'}`} />
      </div>
    </motion.button>
  )
}
