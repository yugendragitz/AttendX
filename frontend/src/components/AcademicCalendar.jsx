import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiAcademicCap, HiBookOpen, HiClipboardCheck, HiClock, HiCalendar } from 'react-icons/hi'

// KL University Academic Calendar 2025-26
const academicEvents = {
  oddSemester: {
    title: 'Odd Semester (2025-26)',
    events: [
      { date: '2025-06-16', name: 'Commencement of Classes (Y1)', type: 'academic' },
      { date: '2025-06-23', name: 'Commencement of Classes (Y2, Y3, Y4)', type: 'academic' },
      { date: '2025-07-15', name: 'Last Date for Registration', type: 'deadline' },
      { date: '2025-08-15', name: 'Independence Day', type: 'holiday' },
      { date: '2025-09-01', name: 'Mid Semester I Exams Begin', type: 'exam' },
      { date: '2025-09-07', name: 'Mid Semester I Exams End', type: 'exam' },
      { date: '2025-10-02', name: 'Gandhi Jayanti', type: 'holiday' },
      { date: '2025-10-15', name: 'Dussehra Vacation Begins', type: 'vacation' },
      { date: '2025-10-20', name: 'Dussehra Vacation Ends', type: 'vacation' },
      { date: '2025-10-28', name: 'Mid Semester II Exams Begin', type: 'exam' },
      { date: '2025-11-03', name: 'Mid Semester II Exams End', type: 'exam' },
      { date: '2025-11-10', name: 'Diwali Vacation Begins', type: 'vacation' },
      { date: '2025-11-15', name: 'Diwali Vacation Ends', type: 'vacation' },
      { date: '2025-12-01', name: 'End Semester Exams Begin', type: 'exam' },
      { date: '2025-12-15', name: 'End Semester Exams End', type: 'exam' },
      { date: '2025-12-16', name: 'Winter Vacation Begins', type: 'vacation' },
    ]
  },
  evenSemester: {
    title: 'Even Semester (2025-26)',
    events: [
      { date: '2026-01-05', name: 'Winter Vacation Ends', type: 'vacation' },
      { date: '2026-01-06', name: 'Commencement of Classes', type: 'academic' },
      { date: '2026-01-14', name: 'Sankranti Holidays Begin', type: 'vacation' },
      { date: '2026-01-17', name: 'Sankranti Holidays End', type: 'vacation' },
      { date: '2026-01-26', name: 'Republic Day', type: 'holiday' },
      { date: '2026-02-15', name: 'Last Date for Registration', type: 'deadline' },
      { date: '2026-03-02', name: 'Mid Semester I Exams Begin', type: 'exam' },
      { date: '2026-03-08', name: 'Mid Semester I Exams End', type: 'exam' },
      { date: '2026-03-30', name: 'Ugadi Holiday', type: 'holiday' },
      { date: '2026-04-14', name: 'Mid Semester II Exams Begin', type: 'exam' },
      { date: '2026-04-20', name: 'Mid Semester II Exams End', type: 'exam' },
      { date: '2026-05-01', name: 'May Day', type: 'holiday' },
      { date: '2026-05-04', name: 'End Semester Exams Begin', type: 'exam' },
      { date: '2026-05-18', name: 'End Semester Exams End', type: 'exam' },
      { date: '2026-05-19', name: 'Summer Vacation Begins', type: 'vacation' },
      { date: '2026-06-15', name: 'Summer Vacation Ends', type: 'vacation' },
    ]
  }
}

const eventTypeConfig = {
  academic: { icon: HiBookOpen, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  exam: { icon: HiClipboardCheck, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  deadline: { icon: HiClock, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  holiday: { icon: HiCalendar, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
  vacation: { icon: HiCalendar, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' },
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function AcademicCalendar() {
  const [activeSemester, setActiveSemester] = useState('evenSemester')
  const [filterType, setFilterType] = useState('all')

  const getFilteredEvents = () => {
    const events = academicEvents[activeSemester].events
    if (filterType === 'all') return events
    return events.filter(e => e.type === filterType)
  }

  const getCurrentEvent = () => {
    const today = new Date()
    const events = academicEvents[activeSemester].events
    const upcoming = events.find(e => new Date(e.date) >= today)
    return upcoming
  }

  const getDaysUntil = (dateStr) => {
    const target = new Date(dateStr)
    const today = new Date()
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <HiAcademicCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Academic Calendar 2025-26</h3>
            <p className="text-gray-400 text-sm">Important dates & events</p>
          </div>
        </div>

        {/* Semester Toggle */}
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl">
          <button
            onClick={() => setActiveSemester('oddSemester')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSemester === 'oddSemester' 
                ? 'bg-neon-purple text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Odd Semester
          </button>
          <button
            onClick={() => setActiveSemester('evenSemester')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSemester === 'evenSemester' 
                ? 'bg-neon-purple text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Even Semester
          </button>
        </div>
      </div>

      {/* Current/Next Event Highlight */}
      {getCurrentEvent() && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6 border border-neon-cyan/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Next Important Date</p>
              <h4 className="text-xl font-bold text-white">{getCurrentEvent().name}</h4>
              <p className="text-neon-cyan mt-1">
                {new Date(getCurrentEvent().date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black text-neon-cyan">
                {getDaysUntil(getCurrentEvent().date)}
              </p>
              <p className="text-gray-400 text-sm">days to go</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
            filterType === 'all' ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400'
          }`}
        >
          All Events
        </button>
        {Object.entries(eventTypeConfig).map(([type, config]) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-2 ${
              filterType === type ? `${config.bg} ${config.color}` : 'bg-white/5 text-gray-400'
            }`}
          >
            <config.icon className="w-4 h-4" />
            <span className="capitalize">{type}</span>
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="glass rounded-xl p-6">
        <h4 className="text-lg font-semibold text-white mb-6">
          {academicEvents[activeSemester].title}
        </h4>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/10" />

          {/* Events */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {getFilteredEvents().map((event, idx) => {
                const config = eventTypeConfig[event.type]
                const Icon = config.icon
                const date = new Date(event.date)
                const isPast = date < new Date()

                return (
                  <motion.div
                    key={event.date + event.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`relative flex items-start gap-4 pl-4 ${isPast ? 'opacity-50' : ''}`}
                  >
                    {/* Timeline dot */}
                    <div className={`
                      relative z-10 w-5 h-5 rounded-full flex items-center justify-center
                      ${config.bg} ${config.border} border-2
                    `}>
                      <div className={`w-2 h-2 rounded-full ${config.bg.replace('/20', '')}`} />
                    </div>

                    {/* Event card */}
                    <div className={`
                      flex-1 p-4 rounded-xl transition-all
                      ${config.bg} ${config.border} border
                    `}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${config.color}`} />
                          <div>
                            <p className="text-white font-medium">{event.name}</p>
                            <span className={`text-xs ${config.color} capitalize`}>{event.type}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${config.color}`}>
                            {date.getDate()} {monthNames[date.getMonth()]} {date.getFullYear()}
                          </p>
                          <p className="text-xs text-gray-400">
                            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()]}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(eventTypeConfig).map(([type, config]) => {
          const count = academicEvents[activeSemester].events.filter(e => e.type === type).length
          const Icon = config.icon
          return (
            <motion.div
              key={type}
              className={`p-4 rounded-xl ${config.bg} ${config.border} border`}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-6 h-6 ${config.color}`} />
                <div>
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <p className={`text-sm ${config.color} capitalize`}>{type}s</p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
