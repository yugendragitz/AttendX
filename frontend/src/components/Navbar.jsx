import { motion } from 'framer-motion'
import { HiBell, HiUser } from 'react-icons/hi'
import ThemeToggle from './ThemeToggle'

export default function Navbar({ studentName = 'Student' }) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <motion.nav
      className="sticky top-0 z-30 glass border-b border-white/10 px-6 py-4"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        {/* Left side - Welcome message */}
        <div className="flex flex-col">
          <motion.h1 
            className="text-2xl font-bold"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Welcome back, <span className="gradient-text">{studentName}</span>
          </motion.h1>
          <motion.p 
            className="text-gray-400 text-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {currentDate}
          </motion.p>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <motion.button
            className="relative p-3 rounded-xl glass hover:bg-white/10 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <HiBell className="w-6 h-6 text-gray-400" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
          </motion.button>

          {/* Profile */}
          <motion.button
            className="flex items-center gap-3 p-2 pr-4 rounded-xl glass hover:bg-white/10 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center">
              <HiUser className="w-5 h-5 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-white">{studentName}</p>
              <p className="text-xs text-gray-400">Student</p>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.nav>
  )
}
