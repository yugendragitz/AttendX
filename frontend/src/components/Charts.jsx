import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg p-3 border border-white/20">
        <p className="text-white font-semibold">{label}</p>
        <p className="text-neon-cyan">
          Attendance: {payload[0].value}%
        </p>
      </div>
    )
  }
  return null
}

// Bar chart for attendance comparison
export function AttendanceBarChart({ data }) {
  // Color based on percentage
  const getBarColor = (percentage) => {
    if (percentage >= 75) return '#22c55e'
    if (percentage >= 60) return '#eab308'
    return '#ef4444'
  }

  return (
    <motion.div
      className="w-full h-[300px] glass rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h3 className="text-lg font-bold mb-4 gradient-text">Subject-wise Attendance</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="attendance" 
            radius={[8, 8, 0, 0]}
            animationDuration={1500}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.attendance)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

// Pie chart for overall attendance distribution
export function AttendancePieChart({ data }) {
  // Calculate distribution
  const getDistribution = () => {
    const good = data.filter(d => d.attendance >= 75).length
    const warning = data.filter(d => d.attendance >= 60 && d.attendance < 75).length
    const critical = data.filter(d => d.attendance < 60).length

    return [
      { name: 'Good (>75%)', value: good, color: '#22c55e' },
      { name: 'Warning (60-75%)', value: warning, color: '#eab308' },
      { name: 'Critical (<60%)', value: critical, color: '#ef4444' },
    ].filter(d => d.value > 0)
  }

  const distribution = getDistribution()

  return (
    <motion.div
      className="w-full h-[300px] glass rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <h3 className="text-lg font-bold mb-4 gradient-text">Attendance Distribution</h3>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={distribution}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
            animationDuration={1500}
            animationBegin={500}
          >
            {distribution.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="glass rounded-lg p-3 border border-white/20">
                    <p className="text-white font-semibold">{payload[0].name}</p>
                    <p className="text-neon-cyan">{payload[0].value} subjects</p>
                  </div>
                )
              }
              return null
            }}
          />
          <Legend 
            verticalAlign="bottom"
            formatter={(value) => <span className="text-gray-400 text-sm">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

// Stats cards showing overall metrics
export function AttendanceStats({ data }) {
  const calculateStats = () => {
    if (!data || data.length === 0) return { average: 0, highest: 0, lowest: 0 }
    
    const attendances = data.map(d => d.attendance)
    return {
      average: Math.round(attendances.reduce((a, b) => a + b, 0) / attendances.length),
      highest: Math.max(...attendances),
      lowest: Math.min(...attendances),
      total: data.length
    }
  }

  const stats = calculateStats()

  const statCards = [
    { label: 'Average', value: `${stats.average}%`, color: 'from-neon-purple to-neon-blue' },
    { label: 'Highest', value: `${stats.highest}%`, color: 'from-green-500 to-green-600' },
    { label: 'Lowest', value: `${stats.lowest}%`, color: 'from-red-500 to-red-600' },
    { label: 'Subjects', value: stats.total, color: 'from-neon-cyan to-neon-blue' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          className="glass rounded-xl p-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.05 }}
        >
          <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
          <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
            {stat.value}
          </p>
        </motion.div>
      ))}
    </div>
  )
}
