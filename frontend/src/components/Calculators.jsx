import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiCalculator, HiChartBar, HiAcademicCap, HiRefresh, HiArrowRight } from 'react-icons/hi'

// LTPS weights
const LTPS_WEIGHTS = { L: 1.0, T: 0.25, P: 0.5, S: 0.25 }

export default function Calculators() {
  const [activeCalculator, setActiveCalculator] = useState('simple')

  const calculators = [
    { id: 'simple', name: 'Simple Attendance', icon: HiCalculator, color: 'from-blue-500 to-cyan-500' },
    { id: 'projected', name: 'Projected Attendance', icon: HiChartBar, color: 'from-green-500 to-emerald-500' },
    { id: 'ltps', name: 'L-T-P-S Calculator', icon: HiCalculator, color: 'from-orange-500 to-red-500' },
    { id: 'cgpa', name: 'CGPA ⇄ Percentage', icon: HiAcademicCap, color: 'from-purple-500 to-pink-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
          <HiCalculator className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Academic Calculators</h3>
          <p className="text-gray-400 text-sm">Essential tools for attendance & grades</p>
        </div>
      </div>

      {/* Calculator Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {calculators.map((calc) => {
          const Icon = calc.icon
          const isActive = activeCalculator === calc.id
          return (
            <motion.button
              key={calc.id}
              onClick={() => setActiveCalculator(calc.id)}
              className={`
                p-4 rounded-xl text-left transition-all
                ${isActive 
                  ? `bg-gradient-to-br ${calc.color} shadow-lg shadow-${calc.color.split('-')[1]}-500/20` 
                  : 'glass hover:bg-white/10'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center mb-3
                ${isActive ? 'bg-white/20' : `bg-gradient-to-br ${calc.color}`}
              `}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h4 className={`font-semibold ${isActive ? 'text-white' : 'text-white'}`}>
                {calc.name}
              </h4>
              <p className={`text-sm mt-1 ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                {calc.id === 'simple' && 'Quick percentage calculations'}
                {calc.id === 'projected' && 'Plan your attendance goals'}
                {calc.id === 'ltps' && 'Weighted LTPS calculator'}
                {calc.id === 'cgpa' && 'Convert CGPA to percentage'}
              </p>
            </motion.button>
          )
        })}
      </div>

      {/* Calculator Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCalculator}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="glass rounded-xl p-6"
        >
          {activeCalculator === 'simple' && <SimpleAttendanceCalculator />}
          {activeCalculator === 'projected' && <ProjectedAttendanceCalculator />}
          {activeCalculator === 'ltps' && <LTPSCalculator />}
          {activeCalculator === 'cgpa' && <CGPACalculator />}
        </motion.div>
      </AnimatePresence>

      {/* Info Banner */}
      <div className="p-4 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30">
        <p className="text-neon-cyan text-sm text-center">
          ✨ All calculators are free to use • Calculations are 100% accurate
        </p>
      </div>
    </div>
  )
}

// Simple Attendance Calculator
function SimpleAttendanceCalculator() {
  const [attended, setAttended] = useState('')
  const [total, setTotal] = useState('')
  const [result, setResult] = useState(null)

  const calculate = () => {
    const att = parseFloat(attended)
    const tot = parseFloat(total)
    if (att >= 0 && tot > 0) {
      const percentage = (att / tot) * 100
      const neededFor75 = Math.max(0, Math.ceil((0.75 * tot - att) / 0.25))
      const canSkip = Math.max(0, Math.floor((att - 0.75 * tot) / 0.75))
      setResult({ percentage, neededFor75, canSkip })
    }
  }

  const reset = () => {
    setAttended('')
    setTotal('')
    setResult(null)
  }

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-white">Simple Attendance Calculator</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Classes Attended</label>
          <input
            type="number"
            value={attended}
            onChange={(e) => setAttended(e.target.value)}
            className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-neon-cyan focus:outline-none"
            placeholder="e.g., 45"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Total Classes</label>
          <input
            type="number"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-neon-cyan focus:outline-none"
            placeholder="e.g., 50"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <motion.button
          onClick={calculate}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Calculate
        </motion.button>
        <motion.button
          onClick={reset}
          className="p-3 rounded-xl bg-white/5 text-gray-400 hover:text-white"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <HiRefresh className="w-5 h-5" />
        </motion.button>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className={`p-4 rounded-xl ${
            result.percentage >= 75 ? 'bg-green-500/20 border-green-500/30' :
            result.percentage >= 60 ? 'bg-yellow-500/20 border-yellow-500/30' :
            'bg-red-500/20 border-red-500/30'
          } border`}>
            <p className="text-gray-400 text-sm">Attendance</p>
            <p className={`text-3xl font-bold ${
              result.percentage >= 75 ? 'text-green-400' :
              result.percentage >= 60 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {result.percentage.toFixed(1)}%
            </p>
          </div>
          <div className="p-4 rounded-xl bg-orange-500/20 border border-orange-500/30">
            <p className="text-gray-400 text-sm">Classes needed for 75%</p>
            <p className="text-3xl font-bold text-orange-400">{result.neededFor75}</p>
          </div>
          <div className="p-4 rounded-xl bg-purple-500/20 border border-purple-500/30">
            <p className="text-gray-400 text-sm">Classes you can skip</p>
            <p className="text-3xl font-bold text-purple-400">{result.canSkip}</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Projected Attendance Calculator
function ProjectedAttendanceCalculator() {
  const [currentAttended, setCurrentAttended] = useState('')
  const [currentTotal, setCurrentTotal] = useState('')
  const [targetPercentage, setTargetPercentage] = useState('75')
  const [upcomingClasses, setUpcomingClasses] = useState('')
  const [result, setResult] = useState(null)

  const calculate = () => {
    const att = parseFloat(currentAttended)
    const tot = parseFloat(currentTotal)
    const target = parseFloat(targetPercentage) / 100
    const upcoming = parseFloat(upcomingClasses)

    if (att >= 0 && tot > 0 && upcoming >= 0) {
      const currentPercentage = (att / tot) * 100
      
      // Classes needed to attend out of upcoming to reach target
      const neededAttendance = Math.ceil(target * (tot + upcoming) - att)
      const minToAttend = Math.max(0, Math.min(upcoming, neededAttendance))
      const canMiss = upcoming - minToAttend
      
      // If attend all upcoming classes
      const maxPercentage = ((att + upcoming) / (tot + upcoming)) * 100
      
      // If miss all upcoming classes
      const minPercentage = (att / (tot + upcoming)) * 100

      setResult({
        currentPercentage,
        minToAttend,
        canMiss,
        maxPercentage,
        minPercentage,
        canReachTarget: maxPercentage >= parseFloat(targetPercentage)
      })
    }
  }

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-white">Projected Attendance Calculator</h4>
      <p className="text-gray-400 text-sm">Plan your classes to achieve target attendance percentage</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Current Attended</label>
          <input
            type="number"
            value={currentAttended}
            onChange={(e) => setCurrentAttended(e.target.value)}
            className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-neon-cyan focus:outline-none"
            placeholder="e.g., 45"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Current Total</label>
          <input
            type="number"
            value={currentTotal}
            onChange={(e) => setCurrentTotal(e.target.value)}
            className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-neon-cyan focus:outline-none"
            placeholder="e.g., 50"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Target %</label>
          <input
            type="number"
            value={targetPercentage}
            onChange={(e) => setTargetPercentage(e.target.value)}
            className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-neon-cyan focus:outline-none"
            placeholder="75"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Upcoming Classes</label>
          <input
            type="number"
            value={upcomingClasses}
            onChange={(e) => setUpcomingClasses(e.target.value)}
            className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-neon-cyan focus:outline-none"
            placeholder="e.g., 20"
          />
        </div>
      </div>

      <motion.button
        onClick={calculate}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold flex items-center justify-center gap-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Calculate Projection <HiArrowRight />
      </motion.button>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className={`p-4 rounded-xl ${
            result.canReachTarget ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'
          } border`}>
            <p className="text-center font-medium text-white">
              {result.canReachTarget 
                ? `✅ You can reach ${targetPercentage}%!` 
                : `❌ Cannot reach ${targetPercentage}% with remaining classes`}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-gray-400 text-sm">Current</p>
              <p className="text-2xl font-bold text-white">{result.currentPercentage.toFixed(1)}%</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-500/20 border border-blue-500/30">
              <p className="text-gray-400 text-sm">Must Attend</p>
              <p className="text-2xl font-bold text-blue-400">{result.minToAttend}</p>
            </div>
            <div className="p-4 rounded-xl bg-purple-500/20 border border-purple-500/30">
              <p className="text-gray-400 text-sm">Can Miss</p>
              <p className="text-2xl font-bold text-purple-400">{Math.max(0, result.canMiss)}</p>
            </div>
            <div className="p-4 rounded-xl bg-green-500/20 border border-green-500/30">
              <p className="text-gray-400 text-sm">Max Possible</p>
              <p className="text-2xl font-bold text-green-400">{result.maxPercentage.toFixed(1)}%</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// LTPS Calculator
function LTPSCalculator() {
  const [ltps, setLtps] = useState({ L: { att: '', tot: '' }, T: { att: '', tot: '' }, P: { att: '', tot: '' }, S: { att: '', tot: '' }})
  const [result, setResult] = useState(null)

  const calculate = () => {
    let weightedAttended = 0
    let weightedTotal = 0
    const breakdown = {}

    Object.entries(ltps).forEach(([type, values]) => {
      const att = parseFloat(values.att) || 0
      const tot = parseFloat(values.tot) || 0
      const weight = LTPS_WEIGHTS[type]
      
      weightedAttended += att * weight
      weightedTotal += tot * weight
      
      if (tot > 0) {
        breakdown[type] = {
          percentage: (att / tot) * 100,
          attended: att,
          total: tot,
          weight: weight * 100
        }
      }
    })

    if (weightedTotal > 0) {
      const percentage = (weightedAttended / weightedTotal) * 100
      setResult({ percentage, breakdown, weightedAttended, weightedTotal })
    }
  }

  const handleChange = (type, field, value) => {
    setLtps(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-white">L-T-P-S Calculator</h4>
        <p className="text-gray-400 text-sm">Calculate weighted attendance with LTPS components</p>
      </div>

      {/* Weight Info */}
      <div className="flex flex-wrap gap-3 p-3 rounded-xl bg-white/5">
        <span className="text-gray-400 text-sm">Weights:</span>
        <span className="text-blue-400 text-sm">L = 100%</span>
        <span className="text-green-400 text-sm">T = 25%</span>
        <span className="text-orange-400 text-sm">P = 50%</span>
        <span className="text-purple-400 text-sm">S = 25%</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { type: 'L', name: 'Lecture', color: 'blue' },
          { type: 'T', name: 'Tutorial', color: 'green' },
          { type: 'P', name: 'Practical', color: 'orange' },
          { type: 'S', name: 'Skilling', color: 'purple' },
        ].map(({ type, name, color }) => (
          <div key={type} className={`p-4 rounded-xl bg-${color}-500/10 border border-${color}-500/30`}>
            <p className={`text-${color}-400 font-semibold mb-3`}>{name} ({type})</p>
            <div className="space-y-2">
              <input
                type="number"
                value={ltps[type].att}
                onChange={(e) => handleChange(type, 'att', e.target.value)}
                className="w-full p-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm focus:outline-none"
                placeholder="Attended"
              />
              <input
                type="number"
                value={ltps[type].tot}
                onChange={(e) => handleChange(type, 'tot', e.target.value)}
                className="w-full p-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm focus:outline-none"
                placeholder="Total"
              />
            </div>
          </div>
        ))}
      </div>

      <motion.button
        onClick={calculate}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Calculate Weighted Attendance
      </motion.button>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className={`p-6 rounded-xl text-center ${
            result.percentage >= 75 ? 'bg-green-500/20 border-green-500/30' :
            result.percentage >= 60 ? 'bg-yellow-500/20 border-yellow-500/30' :
            'bg-red-500/20 border-red-500/30'
          } border`}>
            <p className="text-gray-400 text-sm">Weighted Attendance</p>
            <p className={`text-5xl font-black ${
              result.percentage >= 75 ? 'text-green-400' :
              result.percentage >= 60 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {result.percentage.toFixed(2)}%
            </p>
            <p className="text-gray-400 text-sm mt-2">
              ({result.weightedAttended.toFixed(2)} / {result.weightedTotal.toFixed(2)})
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(result.breakdown).map(([type, data]) => (
              <div key={type} className="p-3 rounded-xl bg-white/5">
                <p className="text-gray-400 text-xs">{type} ({data.weight}% weight)</p>
                <p className="text-white font-semibold">{data.attended}/{data.total}</p>
                <p className="text-neon-cyan text-sm">{data.percentage.toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

// CGPA Calculator
function CGPACalculator() {
  const [mode, setMode] = useState('cgpa2percent') // 'cgpa2percent' or 'percent2cgpa'
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)

  const calculate = () => {
    const value = parseFloat(input)
    if (isNaN(value)) return

    if (mode === 'cgpa2percent') {
      // KLU formula: Percentage = CGPA * 9.5
      if (value >= 0 && value <= 10) {
        const percentage = value * 9.5
        setResult({ percentage, cgpa: value })
      }
    } else {
      // Percentage to CGPA: CGPA = Percentage / 9.5
      if (value >= 0 && value <= 100) {
        const cgpa = value / 9.5
        setResult({ percentage: value, cgpa: Math.min(10, cgpa) })
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-white">CGPA ⇄ Percentage Converter</h4>
        <p className="text-gray-400 text-sm">Convert between CGPA and percentage (KLU formula: % = CGPA × 9.5)</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl w-fit">
        <button
          onClick={() => { setMode('cgpa2percent'); setResult(null); setInput(''); }}
          className={`px-4 py-2 rounded-lg text-sm transition-all ${
            mode === 'cgpa2percent' ? 'bg-neon-purple text-white' : 'text-gray-400'
          }`}
        >
          CGPA → %
        </button>
        <button
          onClick={() => { setMode('percent2cgpa'); setResult(null); setInput(''); }}
          className={`px-4 py-2 rounded-lg text-sm transition-all ${
            mode === 'percent2cgpa' ? 'bg-neon-purple text-white' : 'text-gray-400'
          }`}
        >
          % → CGPA
        </button>
      </div>

      <div className="max-w-md">
        <label className="block text-sm text-gray-400 mb-2">
          {mode === 'cgpa2percent' ? 'Enter CGPA (0-10)' : 'Enter Percentage (0-100)'}
        </label>
        <input
          type="number"
          step="0.01"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-neon-cyan focus:outline-none"
          placeholder={mode === 'cgpa2percent' ? 'e.g., 8.5' : 'e.g., 80.75'}
        />
      </div>

      <motion.button
        onClick={calculate}
        className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Convert
      </motion.button>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg"
        >
          <div className="p-4 rounded-xl bg-purple-500/20 border border-purple-500/30">
            <p className="text-gray-400 text-sm">CGPA</p>
            <p className="text-3xl font-bold text-purple-400">{result.cgpa.toFixed(2)}</p>
          </div>
          <div className="p-4 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
            <p className="text-gray-400 text-sm">Percentage</p>
            <p className="text-3xl font-bold text-cyan-400">{result.percentage.toFixed(2)}%</p>
          </div>
        </motion.div>
      )}

      {/* Reference Table */}
      <div className="mt-6">
        <h5 className="text-sm font-medium text-gray-400 mb-3">Quick Reference</h5>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
          {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(cgpa => (
            <div key={cgpa} className="p-2 rounded-lg bg-white/5 text-center">
              <p className="text-white font-semibold text-sm">{cgpa}</p>
              <p className="text-gray-400 text-xs">{(cgpa * 9.5).toFixed(0)}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
