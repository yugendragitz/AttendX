import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import CircularProgress from './CircularProgress'
import { HiTrendingUp, HiTrendingDown, HiChevronDown, HiChevronUp } from 'react-icons/hi'
import { 
  parseLTPS, 
  calculateLTPSBreakdown, 
  calculateWeightedAttendance,
  calculateClassesNeeded,
  calculateSkippableClasses
} from './LPTSCalculator'

// Individual subject attendance card with LTPS weighted calculation
export default function AttendanceCard({ subject, index = 0, showWeighted = true }) {
  const [expanded, setExpanded] = useState(false)
  const [useWeighted, setUseWeighted] = useState(showWeighted)
  
  // Sync with parent's showWeighted prop
  useEffect(() => {
    setUseWeighted(showWeighted)
  }, [showWeighted])
  
  const { 
    name, 
    attendance: rawAttendance, 
    totalClasses = 0, 
    attendedClasses = 0, 
    ltps = '', 
    tcbr = 0 
  } = subject

  // Parse LTPS and calculate breakdown
  const parsedLTPS = parseLTPS(ltps)
  const breakdown = calculateLTPSBreakdown(ltps, totalClasses, attendedClasses)
  const weightedAttendance = calculateWeightedAttendance(breakdown)
  
  // Use weighted or raw attendance based on toggle
  const displayAttendance = useWeighted && parsedLTPS.total > 0 ? weightedAttendance : rawAttendance
  
  // Calculate how many real classes are needed/skippable based on actual class counts.
  const calculateRawClassesNeeded = (attended, total, targetPercent = 75) => {
    if (total <= 0) return 0
    const targetRatio = targetPercent / 100
    const needed = Math.ceil((targetRatio * total - attended) / (1 - targetRatio))
    return Math.max(0, needed)
  }

  const calculateRawSkippableClasses = (attended, total, targetPercent = 75) => {
    if (total <= 0) return 0
    const targetRatio = targetPercent / 100
    const skippable = Math.floor((attended / targetRatio) - total)
    return Math.max(0, skippable)
  }

  // Weighted fallback is kept for cases where raw class counts are unavailable.
  const weightedClassesNeeded = calculateClassesNeeded(breakdown)
  const weightedSkippableClasses = calculateSkippableClasses(breakdown)
  const classesNeeded = totalClasses > 0
    ? calculateRawClassesNeeded(attendedClasses, totalClasses)
    : weightedClassesNeeded
  const skippableClasses = totalClasses > 0
    ? calculateRawSkippableClasses(attendedClasses, totalClasses)
    : weightedSkippableClasses

  // Determine status color and icon based on displayed attendance
  const getStatus = () => {
    if (displayAttendance >= 75) return { 
      color: 'green', 
      label: 'Good', 
      bgClass: 'from-green-500/20 to-green-600/10',
      borderClass: 'border-green-500/30',
      icon: HiTrendingUp
    }
    if (displayAttendance >= 60) return { 
      color: 'yellow', 
      label: 'Warning', 
      bgClass: 'from-yellow-500/20 to-yellow-600/10',
      borderClass: 'border-yellow-500/30',
      icon: HiTrendingDown
    }
    return { 
      color: 'red', 
      label: 'Critical', 
      bgClass: 'from-red-500/20 to-red-600/10',
      borderClass: 'border-red-500/30',
      icon: HiTrendingDown
    }
  }

  const status = getStatus()
  const StatusIcon = status.icon

  return (
    <motion.div
      className={`
        relative overflow-hidden rounded-2xl
        bg-gradient-to-br ${status.bgClass}
        border ${status.borderClass}
        backdrop-blur-xl
        card-hover cursor-pointer group
      `}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.1, 
        duration: 0.5,
        type: 'spring',
        stiffness: 100
      }}
      whileHover={{ y: -5 }}
    >
      {/* Background glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

      {/* Main Card Content */}
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between">
          {/* Left side - Info */}
          <div className="flex-1">
            {/* Status badges */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <StatusIcon 
                className={`w-5 h-5 ${
                  status.color === 'green' ? 'text-green-400' :
                  status.color === 'yellow' ? 'text-yellow-400' : 'text-red-400'
                }`} 
              />
              <span className={`
                text-xs font-semibold px-2 py-1 rounded-full
                ${status.color === 'green' ? 'bg-green-500/20 text-green-400' :
                  status.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'}
              `}>
                {status.label}
              </span>
              
              {/* LTPS Badge */}
              {ltps && parsedLTPS.total > 0 && (
                <span className="text-xs font-mono px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">
                  {ltps}
                </span>
              )}
              
              {/* Weighted/Raw Toggle */}
              {parsedLTPS.total > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setUseWeighted(!useWeighted)
                  }}
                  className={`text-xs px-2 py-1 rounded-full transition-all ${
                    useWeighted 
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}
                >
                  {useWeighted ? 'Weighted' : 'Raw'}
                </button>
              )}
            </div>

            {/* Subject Name */}
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-neon-cyan transition-colors">
              {name}
            </h3>

            {/* Class counts */}
            {totalClasses > 0 && (
              <p className="text-sm text-gray-400">
                {attendedClasses} / {totalClasses} classes
              </p>
            )}

            {/* LTPS Breakdown Preview (compact) */}
            {ltps && parsedLTPS.total > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {parsedLTPS.L > 0 && (
                  <span className="text-blue-400">
                    L: {breakdown.L.attended}/{breakdown.L.total}
                  </span>
                )}
                {parsedLTPS.T > 0 && (
                  <span className="text-green-400">
                    T: {breakdown.T.attended}/{breakdown.T.total}
                  </span>
                )}
                {parsedLTPS.P > 0 && (
                  <span className="text-orange-400">
                    P: {breakdown.P.attended}/{breakdown.P.total}
                  </span>
                )}
                {parsedLTPS.S > 0 && (
                  <span className="text-pink-400">
                    S: {breakdown.S.attended}/{breakdown.S.total}
                  </span>
                )}
              </div>
            )}

            {/* Bunk Calculator */}
            <motion.div 
              className="mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {displayAttendance < 75 ? (
                <span className="text-xs font-semibold text-red-400">
                  📌 Need {classesNeeded} more classes for 75%
                </span>
              ) : skippableClasses > 0 ? (
                <span className="text-xs font-semibold text-cyan-400">
                  🎯 Can skip {skippableClasses} class{skippableClasses > 1 ? 'es' : ''}
                </span>
              ) : (
                <span className="text-xs font-semibold text-yellow-400">
                  ⚠️ Strict subject - attend all classes
                </span>
              )}
            </motion.div>

            {/* TCBR from ERP */}
            {tcbr > 0 && (
              <motion.p 
                className="text-xs text-orange-400 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                📊 TCBR: {tcbr}
              </motion.p>
            )}

            {/* Expand button */}
            {parsedLTPS.total > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setExpanded(!expanded)
                }}
                className="mt-2 text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                {expanded ? <HiChevronUp /> : <HiChevronDown />}
                {expanded ? 'Hide' : 'Show'} details
              </button>
            )}
          </div>

          {/* Right side - Progress */}
          <div className="ml-4 flex flex-col items-center">
            <CircularProgress 
              percentage={displayAttendance} 
              size={100}
              strokeWidth={8}
            />
            {useWeighted && parsedLTPS.total > 0 && rawAttendance !== weightedAttendance && (
              <span className="text-xs text-gray-500 mt-1">
                Raw: {rawAttendance}%
              </span>
            )}
          </div>
        </div>

        {/* Expanded LTPS Details */}
        <AnimatePresence>
          {expanded && parsedLTPS.total > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-gray-700/50">
                {/* Detailed LTPS Grid */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {parsedLTPS.L > 0 && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-400 text-sm font-semibold">Lecture</span>
                        <span className="text-xs text-gray-400">(100%)</span>
                      </div>
                      <div className="text-white text-lg font-bold">
                        {breakdown.L.attended}/{breakdown.L.total}
                      </div>
                      <div className="text-xs text-gray-400">
                        {breakdown.L.total > 0 ? Math.round((breakdown.L.attended / breakdown.L.total) * 100) : 0}% attended
                      </div>
                    </div>
                  )}
                  {parsedLTPS.T > 0 && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                      <div className="flex justify-between items-center">
                        <span className="text-green-400 text-sm font-semibold">Tutorial</span>
                        <span className="text-xs text-gray-400">(25%)</span>
                      </div>
                      <div className="text-white text-lg font-bold">
                        {breakdown.T.attended}/{breakdown.T.total}
                      </div>
                      <div className="text-xs text-gray-400">
                        {breakdown.T.total > 0 ? Math.round((breakdown.T.attended / breakdown.T.total) * 100) : 0}% attended
                      </div>
                    </div>
                  )}
                  {parsedLTPS.P > 0 && (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2">
                      <div className="flex justify-between items-center">
                        <span className="text-orange-400 text-sm font-semibold">Practical</span>
                        <span className="text-xs text-gray-400">(50%)</span>
                      </div>
                      <div className="text-white text-lg font-bold">
                        {breakdown.P.attended}/{breakdown.P.total}
                      </div>
                      <div className="text-xs text-gray-400">
                        {breakdown.P.total > 0 ? Math.round((breakdown.P.attended / breakdown.P.total) * 100) : 0}% attended
                      </div>
                    </div>
                  )}
                  {parsedLTPS.S > 0 && (
                    <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg px-3 py-2">
                      <div className="flex justify-between items-center">
                        <span className="text-pink-400 text-sm font-semibold">Skilling</span>
                        <span className="text-xs text-gray-400">(25%)</span>
                      </div>
                      <div className="text-white text-lg font-bold">
                        {breakdown.S.attended}/{breakdown.S.total}
                      </div>
                      <div className="text-xs text-gray-400">
                        {breakdown.S.total > 0 ? Math.round((breakdown.S.attended / breakdown.S.total) * 100) : 0}% attended
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Weighted Attendance:</span>
                    <span className={`text-lg font-bold ${
                      weightedAttendance >= 75 ? 'text-green-400' :
                      weightedAttendance >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {weightedAttendance}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Raw Attendance:</span>
                    <span className="text-gray-300">{rawAttendance}%</span>
                  </div>
                  <div className="text-xs text-gray-500 pt-2 border-t border-gray-700/50">
                    Formula: (L×100% + T×25% + P×50% + S×25%) / Total
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hover gradient line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  )
}
