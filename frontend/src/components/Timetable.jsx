import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiClock, HiRefresh, HiDownload, HiLocationMarker } from 'react-icons/hi'

// Default timetable structure - users can customize
const defaultTimeSlots = [
  { slot: 1, time: '8:30 AM - 9:30 AM' },
  { slot: 2, time: '9:30 AM - 10:30 AM' },
  { slot: 3, time: '10:40 AM - 11:40 AM' },
  { slot: 4, time: '11:40 AM - 12:40 PM' },
  { slot: 5, time: '1:30 PM - 2:30 PM' },
  { slot: 6, time: '2:30 PM - 3:30 PM' },
  { slot: 7, time: '3:40 PM - 4:40 PM' },
]

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Empty timetable - will be populated from ERP on login
const sampleTimetable = {
  Mon: [null, null, null, null, null, null, null],
  Tue: [null, null, null, null, null, null, null],
  Wed: [null, null, null, null, null, null, null],
  Thu: [null, null, null, null, null, null, null],
  Fri: [null, null, null, null, null, null, null],
  Sat: [null, null, null, null, null, null, null],
}

const typeColors = {
  L: { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400', label: 'Lecture' },
  T: { bg: 'bg-green-500/20', border: 'border-green-500/40', text: 'text-green-400', label: 'Tutorial' },
  P: { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400', label: 'Practical' },
  S: { bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-400', label: 'Skilling' },
}

export default function Timetable({ sessionData }) {
  const [viewMode, setViewMode] = useState('week') // 'week' or 'day'
  const [currentDay, setCurrentDay] = useState(new Date().getDay() - 1) // 0 = Monday
  
  // Use session timetable if available, otherwise use sample
  const getTimetableData = () => {
    if (sessionData?.timetable && Object.keys(sessionData.timetable).length > 0) {
      // Check if the timetable has actual data
      const hasData = Object.values(sessionData.timetable).some(
        daySlots => daySlots && daySlots.some(slot => slot !== null)
      )
      if (hasData) {
        return sessionData.timetable
      }
    }
    return sampleTimetable
  }
  
  const [timetable, setTimetable] = useState(getTimetableData())
  const [isLive, setIsLive] = useState(true)

  // Update timetable when sessionData changes
  useEffect(() => {
    setTimetable(getTimetableData())
  }, [sessionData])

  // Highlight current time slot
  const getCurrentSlot = () => {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const time = hours * 60 + minutes

    const slots = [
      { start: 8*60+30, end: 9*60+30 },
      { start: 9*60+30, end: 10*60+30 },
      { start: 10*60+40, end: 11*60+40 },
      { start: 11*60+40, end: 12*60+40 },
      { start: 13*60+30, end: 14*60+30 },
      { start: 14*60+30, end: 15*60+30 },
      { start: 15*60+40, end: 16*60+40 },
    ]

    for (let i = 0; i < slots.length; i++) {
      if (time >= slots[i].start && time <= slots[i].end) return i
    }
    return -1
  }

  const [currentSlot, setCurrentSlot] = useState(getCurrentSlot())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlot(getCurrentSlot())
    }, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  const getTodayClasses = () => {
    const dayIndex = new Date().getDay() - 1
    if (dayIndex < 0 || dayIndex > 5) return []
    const dayName = days[dayIndex]
    return timetable[dayName] || []
  }

  const getClassCount = () => {
    const classes = getTodayClasses()
    return classes.filter(c => c !== null).length
  }

  // Check if timetable has any data
  const hasTimetableData = () => {
    return Object.values(timetable).some(
      daySlots => daySlots && daySlots.some(slot => slot !== null)
    )
  }

  const renderClassCell = (classInfo, slotIdx, dayIdx, isCurrentSlot) => {
    if (!classInfo) {
      return (
        <div className="h-full min-h-[60px] rounded-lg bg-white/5 border border-white/5" />
      )
    }

    const colors = typeColors[classInfo.type] || typeColors.L

    return (
      <motion.div
        className={`
          h-full min-h-[60px] p-2 rounded-lg relative overflow-hidden
          ${colors.bg} ${colors.border} border
          ${isCurrentSlot ? 'ring-2 ring-neon-cyan animate-pulse' : ''}
        `}
        whileHover={{ scale: 1.02 }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: (dayIdx * 7 + slotIdx) * 0.01 }}
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            <p className={`text-xs font-bold ${colors.text}`}>{classInfo.code}</p>
            <p className="text-white text-xs font-medium truncate">{classInfo.name}</p>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
              {classInfo.type}
            </span>
            <span className="text-gray-400 text-[10px] flex items-center gap-0.5">
              <HiLocationMarker className="w-2.5 h-2.5" />
              {classInfo.room}
            </span>
          </div>
        </div>
        {isCurrentSlot && (
          <div className="absolute top-1 right-1">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-cyan"></span>
            </span>
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <HiClock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Timetable</h3>
            <p className="text-gray-400 text-sm">
              Year: 2025-2026 | Semester: Even | Updated: Just now
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                viewMode === 'week' ? 'bg-neon-purple text-white' : 'text-gray-400'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                viewMode === 'day' ? 'bg-neon-purple text-white' : 'text-gray-400'
              }`}
            >
              Day
            </button>
          </div>

          <motion.button
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Reload"
          >
            <HiRefresh className="w-5 h-5" />
          </motion.button>

          <motion.button
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Download"
          >
            <HiDownload className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Today's Quick Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-gray-400 text-sm">Today</p>
              <p className="text-xl font-bold text-white">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <p className="text-gray-400 text-sm">Classes Today</p>
              <p className="text-xl font-bold text-neon-cyan">{getClassCount()}</p>
            </div>
            {currentSlot >= 0 && (
              <>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <p className="text-gray-400 text-sm">Current Period</p>
                  <p className="text-xl font-bold text-neon-purple">Period {currentSlot + 1}</p>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {Object.entries(typeColors).map(([type, config]) => (
              <div key={type} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${config.bg} ${config.border} border`} />
                <span className="text-xs text-gray-400">{config.label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Timetable Grid */}
      <AnimatePresence mode="wait">
        {!hasTimetableData() ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-8 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <HiClock className="w-8 h-8 text-purple-400" />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">No Timetable Data</h4>
            <p className="text-gray-400 mb-4">
              Your timetable will be fetched automatically when you login to KL ERP.
            </p>
            <p className="text-sm text-gray-500">
              Login again to refresh and fetch your current semester timetable.
            </p>
          </motion.div>
        ) : viewMode === 'week' ? (
          <motion.div
            key="week"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="glass rounded-xl p-4 overflow-x-auto"
          >
            <table className="w-full min-w-[800px]">
              <thead>
                <tr>
                  <th className="w-20 p-2 text-left text-gray-400 text-sm font-medium">Period</th>
                  {days.map((day, idx) => {
                    const isToday = idx === new Date().getDay() - 1
                    return (
                      <th 
                        key={day} 
                        className={`p-2 text-center text-sm font-medium ${
                          isToday ? 'text-neon-cyan' : 'text-gray-400'
                        }`}
                      >
                        <span className={isToday ? 'px-3 py-1 rounded-lg bg-neon-cyan/20' : ''}>
                          {day}
                        </span>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {defaultTimeSlots.map((slot, slotIdx) => (
                  <tr key={slot.slot}>
                    <td className="p-2 text-center">
                      <div className={`
                        text-xs rounded-lg py-1 px-2
                        ${slotIdx === currentSlot ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-gray-500'}
                      `}>
                        <p className="font-bold">{slot.slot}</p>
                        <p className="text-[10px]">{slot.time}</p>
                      </div>
                    </td>
                    {days.map((day, dayIdx) => {
                      const classInfo = timetable[day]?.[slotIdx]
                      const isCurrentSlot = dayIdx === new Date().getDay() - 1 && slotIdx === currentSlot
                      return (
                        <td key={day} className="p-1">
                          {renderClassCell(classInfo, slotIdx, dayIdx, isCurrentSlot)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        ) : (
          <motion.div
            key="day"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Day selector */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {days.map((day, idx) => {
                const isToday = idx === new Date().getDay() - 1
                const isSelected = idx === currentDay
                return (
                  <motion.button
                    key={day}
                    onClick={() => setCurrentDay(idx)}
                    className={`
                      px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap
                      ${isSelected 
                        ? 'bg-neon-purple text-white' 
                        : isToday 
                          ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }
                    `}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {fullDays[idx]}
                    {isToday && !isSelected && ' (Today)'}
                  </motion.button>
                )
              })}
            </div>

            {/* Day schedule */}
            <div className="glass rounded-xl p-4">
              <h4 className="text-lg font-semibold text-white mb-4">{fullDays[currentDay]}'s Schedule</h4>
              <div className="space-y-3">
                {defaultTimeSlots.map((slot, slotIdx) => {
                  const classInfo = timetable[days[currentDay]]?.[slotIdx]
                  const isCurrentSlot = currentDay === new Date().getDay() - 1 && slotIdx === getCurrentSlot()
                  
                  return (
                    <motion.div
                      key={slot.slot}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: slotIdx * 0.05 }}
                      className={`
                        flex items-stretch gap-4 p-3 rounded-xl
                        ${isCurrentSlot ? 'bg-neon-cyan/10 border border-neon-cyan/30' : 'bg-white/5'}
                      `}
                    >
                      <div className="w-20 flex-shrink-0 text-center">
                        <p className={`font-bold ${isCurrentSlot ? 'text-neon-cyan' : 'text-gray-400'}`}>
                          Period {slot.slot}
                        </p>
                        <p className="text-xs text-gray-500">{slot.time}</p>
                      </div>
                      <div className="flex-1">
                        {classInfo ? (
                          <div className={`
                            p-3 rounded-lg ${typeColors[classInfo.type].bg} ${typeColors[classInfo.type].border} border
                          `}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`font-bold ${typeColors[classInfo.type].text}`}>
                                  {classInfo.code}
                                </p>
                                <p className="text-white">{classInfo.name}</p>
                              </div>
                              <div className="text-right">
                                <span className={`
                                  text-sm px-2 py-1 rounded-lg
                                  ${typeColors[classInfo.type].bg} ${typeColors[classInfo.type].text}
                                `}>
                                  {typeColors[classInfo.type].label}
                                </span>
                                <p className="text-gray-400 text-sm mt-1 flex items-center justify-end gap-1">
                                  <HiLocationMarker className="w-3 h-3" />
                                  {classInfo.room}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-gray-500 text-center">
                            No class scheduled
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
