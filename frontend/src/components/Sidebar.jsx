import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  HiHome, 
  HiChartBar, 
  HiCalendar, 
  HiCog, 
  HiLogout,
  HiMenuAlt2,
  HiX,
  HiClock,
  HiCalculator,
  HiAcademicCap
} from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'

const menuItems = [
  { icon: HiHome, label: 'Dashboard', id: 'dashboard' },
  { icon: HiChartBar, label: 'Analytics', id: 'analytics' },
  { icon: HiClock, label: 'Timetable', id: 'timetable' },
  { icon: HiCalendar, label: 'Calendar', id: 'calendar' },
  { icon: HiAcademicCap, label: 'Academic', id: 'academic' },
  { icon: HiCalculator, label: 'Calculators', id: 'calculators' },
  { icon: HiCog, label: 'Settings', id: 'settings' },
]

export default function Sidebar({ activeItem = 'Dashboard', onNavigate }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [currentActive, setCurrentActive] = useState(activeItem)
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('attendx_session')
    navigate('/')
  }

  const handleMenuClick = (item) => {
    setCurrentActive(item.label)
    setIsMobileOpen(false)
    
    // Scroll to section if onNavigate is provided
    if (onNavigate) {
      onNavigate(item.id)
    }
    
    // Scroll to element with matching id
    const element = document.getElementById(item.id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-white/10">
        <motion.div
          className="w-10 h-10 rounded-xl bg-white flex items-center justify-center"
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <span className="text-dark-900 font-black text-lg">Y</span>
        </motion.div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col leading-tight"
            >
              <span className="text-xl font-black text-white tracking-tight" style={{fontFamily: "Arial Black, Helvetica, sans-serif"}}>YUGI'S ATTENDX</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon
          const isActive = currentActive === item.label

          return (
            <motion.button
              key={item.label}
              onClick={() => handleMenuClick(item)}
              className={`
                w-full flex items-center gap-3 p-3 rounded-xl relative
                transition-all duration-300
                ${isActive 
                  ? 'bg-gradient-to-r from-neon-purple/20 to-neon-blue/20 border border-neon-purple/30' 
                  : 'hover:bg-white/5'
                }
              `}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ x: 5 }}
            >
              <Icon 
                className={`
                  w-6 h-6 sidebar-icon
                  ${isActive ? 'text-neon-cyan' : 'text-gray-400'}
                `} 
              />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={`font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && (
                <motion.div
                  className="absolute right-0 w-1 h-8 bg-gradient-to-b from-neon-purple to-neon-cyan rounded-l"
                  layoutId="activeIndicator"
                />
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-white/10">
        <motion.button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all duration-300"
          whileHover={{ x: 5 }}
        >
          <HiLogout className="w-6 h-6" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-medium"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Collapse Toggle (Desktop) */}
      <div className="hidden md:block p-4">
        <motion.button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-white/5 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <HiMenuAlt2 className="w-6 h-6 text-gray-400" />
          </motion.div>
        </motion.button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-3 rounded-xl glass"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <HiX className="w-6 h-6 text-white" />
        ) : (
          <HiMenuAlt2 className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`
          fixed md:sticky top-0 left-0 h-screen z-40
          glass border-r border-white/10
          transition-all duration-300 ease-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
        initial={false}
        animate={{
          width: isCollapsed ? 80 : 256,
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <SidebarContent />
      </motion.aside>
    </>
  )
}
