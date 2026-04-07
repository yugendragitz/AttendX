import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ThemeProvider } from './hooks/useTheme.jsx'
import { ToastProvider } from './hooks/useToast.jsx'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'

function App() {
  const location = useLocation()

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="min-h-screen bg-dark-900 text-white font-sans">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<LoginPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Routes>
          </AnimatePresence>
        </div>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
