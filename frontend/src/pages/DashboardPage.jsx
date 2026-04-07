import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiCog, HiMoon, HiSun, HiBell, HiShieldCheck } from 'react-icons/hi'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import AttendanceCard from '../components/AttendanceCard'
import { AttendanceBarChart, AttendancePieChart, AttendanceStats } from '../components/Charts'
import { DashboardSkeleton } from '../components/SkeletonLoader'
import PageTransition from '../components/PageTransition'
import ToastContainer from '../components/Toast'
import { useToast } from '../hooks/useToast.jsx'
import { useTheme } from '../hooks/useTheme.jsx'
import { getSession, clearSession } from '../utils/storage'
import HolidaysCalendar from '../components/HolidaysCalendar'
import AcademicCalendar from '../components/AcademicCalendar'
import Timetable from '../components/Timetable'
import Calculators from '../components/Calculators'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { isDark, toggleTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [sessionData, setSessionData] = useState(null)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [useWeightedAttendance, setUseWeightedAttendance] = useState(true) // Global toggle for LTPS weighted

  // Load session data on mount
  useEffect(() => {
    const loadSession = async () => {
      const session = getSession()
      
      if (!session) {
        addToast({
          type: 'warning',
          title: 'Session Expired',
          message: 'Please login again',
        })
        navigate('/')
        return
      }

      // Simulate loading for demo purposes
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSessionData(session)
      setIsLoading(false)
    }

    loadSession()
  }, [navigate, addToast])

  // Handle refresh
  const handleRefresh = () => {
    addToast({
      type: 'info',
      title: 'Refreshing...',
      message: 'Please login again to refresh data',
    })
    clearSession()
    navigate('/')
  }

  // Handle sidebar navigation
  const handleNavigate = (sectionId) => {
    setActiveSection(sectionId)
  }

  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex min-h-screen bg-dark-900">
          <div className="w-64 glass" />
          <div className="flex-1">
            <DashboardSkeleton />
          </div>
        </div>
      </PageTransition>
    )
  }

  const { studentName = 'Student', subjects = [] } = sessionData || {}

  return (
    <PageTransition>
      <div className="flex min-h-screen bg-dark-900">
        {/* Sidebar */}
        <Sidebar activeItem="Dashboard" onNavigate={handleNavigate} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Navbar */}
          <Navbar studentName={studentName} />

          {/* Dashboard Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {/* Dashboard Section */}
            <section id="dashboard">
              {/* Header with refresh button */}
              <motion.div
                className="flex items-center justify-between mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div>
                  <h2 className="text-2xl font-bold text-white">Attendance Overview</h2>
                  <p className="text-gray-400">
                    Last updated: {sessionData?.lastUpdated 
                      ? new Date(sessionData.lastUpdated).toLocaleString() 
                      : 'Just now'}
                  </p>
                </div>
                <motion.button
                  onClick={handleRefresh}
                  className="px-4 py-2 rounded-xl glass hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Refresh Data
                </motion.button>
              </motion.div>

              {/* Stats Overview */}
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <AttendanceStats data={subjects} />
              </motion.div>

              {/* Attendance Cards Grid */}
              <motion.div
                className="mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">Subject-wise Attendance</h3>
                  
                  {/* Global Weighted/Raw Toggle */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">Display:</span>
                    <button
                      onClick={() => setUseWeightedAttendance(!useWeightedAttendance)}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-xl transition-all
                        ${useWeightedAttendance 
                          ? 'bg-purple-500/20 border border-purple-500/30 text-purple-400' 
                          : 'bg-gray-500/20 border border-gray-500/30 text-gray-400'}
                      `}
                    >
                      <div className={`w-10 h-5 rounded-full relative transition-colors ${
                        useWeightedAttendance ? 'bg-purple-500' : 'bg-gray-600'
                      }`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          useWeightedAttendance ? 'translate-x-5' : 'translate-x-0.5'
                        }`} />
                      </div>
                      <span className="text-sm font-medium">
                        {useWeightedAttendance ? 'Weighted (LTPS)' : 'Raw'}
                      </span>
                    </button>
                  </div>
                </div>
                
                {/* LTPS Info Banner */}
                {useWeightedAttendance && (
                  <motion.div 
                    className="mb-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <p className="text-xs text-purple-300">
                      <strong>LTPS Weighted Attendance:</strong> L (Lecture) = 100%, T (Tutorial) = 25%, P (Practical) = 50%, S (Skilling) = 25%
                    </p>
                  </motion.div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subjects.map((subject, index) => (
                    <AttendanceCard
                      key={subject.name}
                      subject={subject}
                      index={index}
                      showWeighted={useWeightedAttendance}
                    />
                  ))}
                </div>
              </motion.div>
            </section>

            {/* Analytics Section */}
            <section id="analytics" className="pt-6">
              <motion.div
                className="mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-xl font-semibold mb-4 text-white">Analytics</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AttendanceBarChart data={subjects} />
                  <AttendancePieChart data={subjects} />
                </div>
              </motion.div>
            </section>

            {/* Timetable Section */}
            <section id="timetable" className="pt-6">
              <motion.div
                className="mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                <Timetable sessionData={sessionData} />
              </motion.div>
            </section>

            {/* Calendar Section - Holidays */}
            <section id="calendar" className="pt-6">
              <motion.div
                className="mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <HolidaysCalendar />
              </motion.div>
            </section>

            {/* Academic Calendar Section */}
            <section id="academic" className="pt-6">
              <motion.div
                className="mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
              >
                <AcademicCalendar />
              </motion.div>
            </section>

            {/* Calculators Section */}
            <section id="calculators" className="pt-6">
              <motion.div
                className="mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Calculators />
              </motion.div>
            </section>

            {/* Settings Section */}
            <section id="settings" className="pt-6">
              <motion.div
                className="mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                  <HiCog className="w-6 h-6" /> Settings
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Appearance */}
                  <div className="glass rounded-xl p-6">
                    <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                      {isDark ? <HiMoon className="w-5 h-5 text-neon-cyan" /> : <HiSun className="w-5 h-5 text-yellow-400" />}
                      Appearance
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white">Dark Mode</p>
                          <p className="text-gray-400 text-sm">Toggle dark/light theme</p>
                        </div>
                        <motion.button
                          onClick={toggleTheme}
                          className={`w-14 h-8 rounded-full p-1 transition-colors ${
                            isDark ? 'bg-neon-purple' : 'bg-gray-600'
                          }`}
                          whileTap={{ scale: 0.95 }}
                        >
                          <motion.div
                            className="w-6 h-6 rounded-full bg-white"
                            animate={{ x: isDark ? 24 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Notifications */}
                  <div className="glass rounded-xl p-6">
                    <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                      <HiBell className="w-5 h-5 text-neon-cyan" />
                      Notifications
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white">Low Attendance Alerts</p>
                          <p className="text-gray-400 text-sm">Notify when below 75%</p>
                        </div>
                        <motion.button
                          className="w-14 h-8 rounded-full p-1 bg-neon-purple"
                          whileTap={{ scale: 0.95 }}
                        >
                          <motion.div
                            className="w-6 h-6 rounded-full bg-white"
                            animate={{ x: 24 }}
                          />
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Privacy */}
                  <div className="glass rounded-xl p-6 md:col-span-2">
                    <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                      <HiShieldCheck className="w-5 h-5 text-green-400" />
                      Privacy & Security
                    </h4>
                    <div className="space-y-3 text-gray-400 text-sm">
                      <p>✓ Your credentials are never stored on our servers</p>
                      <p>✓ Data is fetched directly from KL University ERP</p>
                      <p>✓ Session expires when you close the browser</p>
                      <p>✓ No personal data is shared with third parties</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </section>
          </main>
        </div>

        {/* Toast Container */}
        <ToastContainer />
      </div>
    </PageTransition>
  )
}
