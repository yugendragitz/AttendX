import { motion } from 'framer-motion'
import { useState } from 'react'
import { HiInformationCircle } from 'react-icons/hi'

// KL University LTPS Weightage System
// L (Lecture) = 100%, T (Tutorial) = 25%, P (Practical) = 50%, S (Skilling) = 25%
export const LTPS_WEIGHTS = {
  L: 1.0,    // 100%
  T: 0.25,   // 25%
  P: 0.50,   // 50%
  S: 0.25    // 25%
}

/**
 * Parse LTPS string (e.g., "3-1-2-0") into object
 */
export const parseLTPS = (ltpsStr) => {
  if (!ltpsStr || typeof ltpsStr !== 'string') {
    return { L: 0, T: 0, P: 0, S: 0, total: 0 }
  }
  const parts = ltpsStr.split('-').map(n => parseInt(n) || 0)
  const parsed = {
    L: parts[0] || 0,
    T: parts[1] || 0,
    P: parts[2] || 0,
    S: parts[3] || 0
  }
  parsed.total = parsed.L + parsed.T + parsed.P + parsed.S
  return parsed
}

/**
 * Calculate LTPS breakdown from total classes based on LTPS ratio
 * Example: LTPS "3-1-2-0" with 60 total classes:
 *   L = 60 * (3/6) = 30, T = 60 * (1/6) = 10, P = 60 * (2/6) = 20, S = 0
 */
export const calculateLTPSBreakdown = (ltpsStr, totalClasses, attendedClasses) => {
  const ltps = parseLTPS(ltpsStr)
  
  if (ltps.total === 0 || totalClasses === 0) {
    return {
      L: { attended: 0, total: 0 },
      T: { attended: 0, total: 0 },
      P: { attended: 0, total: 0 },
      S: { attended: 0, total: 0 },
      rawAttendance: totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0
    }
  }

  // Calculate ratio for each component
  const ratio = {
    L: ltps.L / ltps.total,
    T: ltps.T / ltps.total,
    P: ltps.P / ltps.total,
    S: ltps.S / ltps.total
  }

  // Distribute total classes based on LTPS ratio
  const breakdown = {
    L: {
      total: Math.round(totalClasses * ratio.L),
      attended: Math.round(attendedClasses * ratio.L)
    },
    T: {
      total: Math.round(totalClasses * ratio.T),
      attended: Math.round(attendedClasses * ratio.T)
    },
    P: {
      total: Math.round(totalClasses * ratio.P),
      attended: Math.round(attendedClasses * ratio.P)
    },
    S: {
      total: Math.round(totalClasses * ratio.S),
      attended: Math.round(attendedClasses * ratio.S)
    }
  }

  breakdown.rawAttendance = totalClasses > 0 
    ? Math.round((attendedClasses / totalClasses) * 100) 
    : 0

  return breakdown
}

/**
 * Calculate weighted attendance using LTPS weights
 * Formula:
 *   Weighted Attended = (L_attended * 1.0) + (T_attended * 0.25) + (P_attended * 0.5) + (S_attended * 0.25)
 *   Weighted Total = (L_total * 1.0) + (T_total * 0.25) + (P_total * 0.5) + (S_total * 0.25)
 *   Final % = (Weighted Attended / Weighted Total) * 100
 */
export const calculateWeightedAttendance = (breakdown) => {
  const weightedAttended = 
    (breakdown.L.attended * LTPS_WEIGHTS.L) +
    (breakdown.T.attended * LTPS_WEIGHTS.T) +
    (breakdown.P.attended * LTPS_WEIGHTS.P) +
    (breakdown.S.attended * LTPS_WEIGHTS.S)

  const weightedTotal = 
    (breakdown.L.total * LTPS_WEIGHTS.L) +
    (breakdown.T.total * LTPS_WEIGHTS.T) +
    (breakdown.P.total * LTPS_WEIGHTS.P) +
    (breakdown.S.total * LTPS_WEIGHTS.S)

  if (weightedTotal === 0) return 0

  return Math.round((weightedAttended / weightedTotal) * 100)
}

/**
 * Calculate classes needed to reach target percentage (default 75%)
 */
export const calculateClassesNeeded = (breakdown, targetPercent = 75) => {
  const currentWeightedAttended = 
    (breakdown.L.attended * LTPS_WEIGHTS.L) +
    (breakdown.T.attended * LTPS_WEIGHTS.T) +
    (breakdown.P.attended * LTPS_WEIGHTS.P) +
    (breakdown.S.attended * LTPS_WEIGHTS.S)

  const currentWeightedTotal = 
    (breakdown.L.total * LTPS_WEIGHTS.L) +
    (breakdown.T.total * LTPS_WEIGHTS.T) +
    (breakdown.P.total * LTPS_WEIGHTS.P) +
    (breakdown.S.total * LTPS_WEIGHTS.S)

  const targetRatio = targetPercent / 100

  // Need: (currentAttended + x) / (currentTotal + x) >= targetRatio
  // currentAttended + x >= targetRatio * (currentTotal + x)
  // currentAttended + x >= targetRatio * currentTotal + targetRatio * x
  // x - targetRatio * x >= targetRatio * currentTotal - currentAttended
  // x * (1 - targetRatio) >= targetRatio * currentTotal - currentAttended
  // x >= (targetRatio * currentTotal - currentAttended) / (1 - targetRatio)

  const needed = Math.ceil(
    (targetRatio * currentWeightedTotal - currentWeightedAttended) / (1 - targetRatio)
  )

  return Math.max(0, needed)
}

/**
 * Calculate classes that can be skipped while staying above target percentage
 */
export const calculateSkippableClasses = (breakdown, targetPercent = 75) => {
  const currentWeightedAttended = 
    (breakdown.L.attended * LTPS_WEIGHTS.L) +
    (breakdown.T.attended * LTPS_WEIGHTS.T) +
    (breakdown.P.attended * LTPS_WEIGHTS.P) +
    (breakdown.S.attended * LTPS_WEIGHTS.S)

  const currentWeightedTotal = 
    (breakdown.L.total * LTPS_WEIGHTS.L) +
    (breakdown.T.total * LTPS_WEIGHTS.T) +
    (breakdown.P.total * LTPS_WEIGHTS.P) +
    (breakdown.S.total * LTPS_WEIGHTS.S)

  const targetRatio = targetPercent / 100

  // Need: currentAttended / (currentTotal + x) >= targetRatio
  // currentAttended >= targetRatio * (currentTotal + x)
  // currentAttended / targetRatio >= currentTotal + x
  // x <= (currentAttended / targetRatio) - currentTotal

  const skippable = Math.floor(
    (currentWeightedAttended / targetRatio) - currentWeightedTotal
  )

  return Math.max(0, skippable)
}

/**
 * LTPS Calculator Display Component
 * Shows detailed breakdown of LTPS attendance
 */
export default function LPTSCalculator({ 
  ltps, 
  totalClasses, 
  attendedClasses, 
  showRaw = false,
  compact = false 
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  
  const breakdown = calculateLTPSBreakdown(ltps, totalClasses, attendedClasses)
  const weightedPercent = calculateWeightedAttendance(breakdown)
  const classesNeeded = calculateClassesNeeded(breakdown)
  const skippableClasses = calculateSkippableClasses(breakdown)

  const ltpsData = parseLTPS(ltps)

  if (compact) {
    return (
      <div className="text-xs space-y-1">
        {/* Raw counts */}
        <div className="flex flex-wrap gap-2 text-gray-400">
          {ltpsData.L > 0 && <span>L: {breakdown.L.attended}/{breakdown.L.total}</span>}
          {ltpsData.T > 0 && <span>T: {breakdown.T.attended}/{breakdown.T.total}</span>}
          {ltpsData.P > 0 && <span>P: {breakdown.P.attended}/{breakdown.P.total}</span>}
          {ltpsData.S > 0 && <span>S: {breakdown.S.attended}/{breakdown.S.total}</span>}
        </div>
        
        {/* Weighted percentage */}
        <div className="flex items-center gap-2">
          <span className="text-purple-400 font-semibold">
            Weighted: {weightedPercent}%
          </span>
          {showRaw && (
            <span className="text-gray-500">
              (Raw: {breakdown.rawAttendance}%)
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header with tooltip */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          LTPS Breakdown
          <span className="text-xs font-mono text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">
            {ltps || 'N/A'}
          </span>
        </h4>
        <div 
          className="relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <HiInformationCircle className="w-5 h-5 text-gray-400 cursor-help hover:text-purple-400 transition-colors" />
          
          {/* Tooltip */}
          {showTooltip && (
            <motion.div 
              className="absolute right-0 top-6 w-64 bg-gray-900 border border-gray-700 rounded-lg p-3 z-50 shadow-xl"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-xs text-gray-300 mb-2 font-semibold">Weight System:</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-blue-400">Lecture (L)</span>
                  <span className="text-white">100%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-400">Tutorial (T)</span>
                  <span className="text-white">25%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-400">Practical (P)</span>
                  <span className="text-white">50%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-pink-400">Skilling (S)</span>
                  <span className="text-white">25%</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* LTPS Counts Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {ltpsData.L > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded px-2 py-1">
            <span className="text-blue-400 text-xs font-semibold">L:</span>
            <span className="text-white text-xs ml-1">
              {breakdown.L.attended}/{breakdown.L.total}
            </span>
            <span className="text-gray-500 text-xs ml-1">(100%)</span>
          </div>
        )}
        {ltpsData.T > 0 && (
          <div className="bg-green-500/10 border border-green-500/30 rounded px-2 py-1">
            <span className="text-green-400 text-xs font-semibold">T:</span>
            <span className="text-white text-xs ml-1">
              {breakdown.T.attended}/{breakdown.T.total}
            </span>
            <span className="text-gray-500 text-xs ml-1">(25%)</span>
          </div>
        )}
        {ltpsData.P > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded px-2 py-1">
            <span className="text-orange-400 text-xs font-semibold">P:</span>
            <span className="text-white text-xs ml-1">
              {breakdown.P.attended}/{breakdown.P.total}
            </span>
            <span className="text-gray-500 text-xs ml-1">(50%)</span>
          </div>
        )}
        {ltpsData.S > 0 && (
          <div className="bg-pink-500/10 border border-pink-500/30 rounded px-2 py-1">
            <span className="text-pink-400 text-xs font-semibold">S:</span>
            <span className="text-white text-xs ml-1">
              {breakdown.S.attended}/{breakdown.S.total}
            </span>
            <span className="text-gray-500 text-xs ml-1">(25%)</span>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-2 pt-2 border-t border-gray-700/50">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-xs">Weighted Attendance:</span>
          <span className={`text-lg font-bold ${
            weightedPercent >= 75 ? 'text-green-400' :
            weightedPercent >= 60 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {weightedPercent}%
          </span>
        </div>
        
        {showRaw && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs">Raw Attendance:</span>
            <span className="text-gray-300 text-sm">{breakdown.rawAttendance}%</span>
          </div>
        )}

        {/* Classes needed or skippable */}
        {weightedPercent < 75 ? (
          <div className="flex justify-between items-center bg-red-500/10 rounded px-2 py-1">
            <span className="text-red-400 text-xs">Classes needed for 75%:</span>
            <span className="text-red-400 font-semibold">{classesNeeded}</span>
          </div>
        ) : skippableClasses > 0 ? (
          <div className="flex justify-between items-center bg-cyan-500/10 rounded px-2 py-1">
            <span className="text-cyan-400 text-xs">Can skip:</span>
            <span className="text-cyan-400 font-semibold">{skippableClasses} classes</span>
          </div>
        ) : (
          <div className="flex justify-between items-center bg-yellow-500/10 rounded px-2 py-1">
            <span className="text-yellow-400 text-xs">Status:</span>
            <span className="text-yellow-400 font-semibold">At limit!</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
