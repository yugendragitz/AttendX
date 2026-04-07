import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiCalendar, HiChevronLeft, HiChevronRight, HiGift, HiStar } from 'react-icons/hi'

// KL University Holidays 2026
const holidays2026 = [
  { date: '2026-01-01', name: 'New Year', type: 'public' },
  { date: '2026-01-14', name: 'Sankranti / Pongal', type: 'festival' },
  { date: '2026-01-15', name: 'Sankranti (Day 2)', type: 'festival' },
  { date: '2026-01-16', name: 'Sankranti (Day 3)', type: 'festival' },
  { date: '2026-01-26', name: 'Republic Day', type: 'national' },
  { date: '2026-02-26', name: 'Maha Shivaratri', type: 'festival' },
  { date: '2026-03-10', name: 'Holi', type: 'festival' },
  { date: '2026-03-30', name: 'Ugadi', type: 'festival' },
  { date: '2026-04-02', name: 'Ram Navami', type: 'festival' },
  { date: '2026-04-03', name: 'Good Friday', type: 'public' },
  { date: '2026-04-14', name: 'Ambedkar Jayanti', type: 'national' },
  { date: '2026-05-01', name: 'May Day', type: 'public' },
  { date: '2026-05-07', name: 'Buddha Purnima', type: 'festival' },
  { date: '2026-05-25', name: 'Eid ul-Fitr', type: 'festival' },
  { date: '2026-07-06', name: 'Muharram', type: 'festival' },
  { date: '2026-08-01', name: 'Bakrid (Eid ul-Adha)', type: 'festival' },
  { date: '2026-08-15', name: 'Independence Day', type: 'national' },
  { date: '2026-08-21', name: 'Vinayaka Chavithi', type: 'festival' },
  { date: '2026-09-04', name: 'Milad-un-Nabi', type: 'festival' },
  { date: '2026-10-02', name: 'Gandhi Jayanti', type: 'national' },
  { date: '2026-10-02', name: 'Dussehra (Vijaya Dashami)', type: 'festival' },
  { date: '2026-10-21', name: 'Diwali', type: 'festival' },
  { date: '2026-10-22', name: 'Diwali (Day 2)', type: 'festival' },
  { date: '2026-11-04', name: 'Kartika Purnima', type: 'festival' },
  { date: '2026-12-25', name: 'Christmas', type: 'public' },
]

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const typeColors = {
  national: { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400', badge: 'National' },
  festival: { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400', badge: 'Festival' },
  public: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400', badge: 'Public' },
}

export default function HolidaysCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear] = useState(2026)
  const [viewMode, setViewMode] = useState('calendar') // 'calendar' or 'list'

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay()

  const getHolidaysForMonth = (month) => {
    return holidays2026.filter(h => {
      const d = new Date(h.date)
      return d.getMonth() === month
    })
  }

  const getHolidayForDate = (day, month) => {
    const dateStr = `2026-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return holidays2026.find(h => h.date === dateStr)
  }

  const getUpcomingHolidays = () => {
    const today = new Date()
    today.setFullYear(2026) // For demo, assume we're in 2026
    return holidays2026
      .filter(h => new Date(h.date) >= today)
      .slice(0, 5)
  }

  const renderCalendarView = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const days = []

    // Empty cells for days before the first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12" />)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const holiday = getHolidayForDate(day, currentMonth)
      const isToday = day === new Date().getDate() && currentMonth === new Date().getMonth()

      days.push(
        <motion.div
          key={day}
          className={`
            h-12 flex items-center justify-center rounded-lg relative cursor-pointer
            transition-all duration-200
            ${holiday ? `${typeColors[holiday.type].bg} ${typeColors[holiday.type].border} border` : 'hover:bg-white/5'}
            ${isToday ? 'ring-2 ring-neon-cyan' : ''}
          `}
          whileHover={{ scale: 1.1 }}
          title={holiday?.name}
        >
          <span className={`
            text-sm font-medium
            ${holiday ? typeColors[holiday.type].text : 'text-gray-300'}
          `}>
            {day}
          </span>
          {holiday && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-neon-purple animate-pulse" />
          )}
        </motion.div>
      )
    }

    return days
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <HiCalendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Holidays 2026</h3>
            <p className="text-gray-400 text-sm">KL University Holiday Calendar</p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              viewMode === 'calendar' ? 'bg-neon-purple text-white' : 'bg-white/5 text-gray-400'
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              viewMode === 'list' ? 'bg-neon-purple text-white' : 'bg-white/5 text-gray-400'
            }`}
          >
            List
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'calendar' ? (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="glass rounded-xl p-6"
          >
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <motion.button
                onClick={() => setCurrentMonth(m => m > 0 ? m - 1 : 11)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <HiChevronLeft className="w-5 h-5 text-gray-400" />
              </motion.button>
              <h4 className="text-lg font-semibold text-white">
                {monthNames[currentMonth]} {currentYear}
              </h4>
              <motion.button
                onClick={() => setCurrentMonth(m => m < 11 ? m + 1 : 0)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <HiChevronRight className="w-5 h-5 text-gray-400" />
              </motion.button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs text-gray-500 font-medium">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {renderCalendarView()}
            </div>

            {/* Holidays this month */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <h5 className="text-sm font-medium text-gray-400 mb-3">Holidays this month</h5>
              <div className="space-y-2">
                {getHolidaysForMonth(currentMonth).length > 0 ? (
                  getHolidaysForMonth(currentMonth).map((holiday, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                      <div className="flex items-center gap-2">
                        <HiGift className={typeColors[holiday.type].text} />
                        <span className="text-white text-sm">{holiday.name}</span>
                      </div>
                      <span className="text-gray-400 text-xs">
                        {new Date(holiday.date).getDate()} {monthNames[currentMonth]}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No holidays this month</p>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-4">
              {Object.entries(typeColors).map(([type, colors]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${colors.bg} ${colors.border} border`} />
                  <span className="text-xs text-gray-400 capitalize">{colors.badge}</span>
                </div>
              ))}
            </div>

            {/* All Holidays List */}
            <div className="glass rounded-xl p-4 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {holidays2026.map((holiday, idx) => {
                  const date = new Date(holiday.date)
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`
                        flex items-center justify-between p-3 rounded-xl
                        ${typeColors[holiday.type].bg} ${typeColors[holiday.type].border} border
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 text-center">
                          <p className={`text-lg font-bold ${typeColors[holiday.type].text}`}>
                            {date.getDate()}
                          </p>
                          <p className="text-xs text-gray-400">{monthNames[date.getMonth()].slice(0, 3)}</p>
                        </div>
                        <div>
                          <p className="text-white font-medium">{holiday.name}</p>
                          <span className={`text-xs ${typeColors[holiday.type].text}`}>
                            {typeColors[holiday.type].badge}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upcoming Holidays Quick View */}
      <div className="glass rounded-xl p-4">
        <h5 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <HiStar className="text-yellow-400" /> Upcoming Holidays
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {getUpcomingHolidays().map((holiday, idx) => {
            const date = new Date(holiday.date)
            return (
              <motion.div
                key={idx}
                className={`p-3 rounded-lg ${typeColors[holiday.type].bg} ${typeColors[holiday.type].border} border`}
                whileHover={{ scale: 1.02 }}
              >
                <p className={`font-bold ${typeColors[holiday.type].text}`}>
                  {date.getDate()} {monthNames[date.getMonth()].slice(0, 3)}
                </p>
                <p className="text-white text-sm truncate">{holiday.name}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
