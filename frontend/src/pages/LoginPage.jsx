import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiUser, HiLockClosed, HiEye, HiEyeOff, HiRefresh, HiShieldCheck } from 'react-icons/hi'
// import ThreeBackground from '../components/ThreeBackground' // Temporarily disabled
import GlassCard from '../components/GlassCard'
import AnimatedButton from '../components/AnimatedButton'
import PageTransition from '../components/PageTransition'
import { LoginLoadingOverlay } from '../components/SkeletonLoader'
import { useToast } from '../hooks/useToast.jsx'
import { initLogin, completeLogin, healthCheck } from '../utils/api'
import { saveSession } from '../utils/storage'

export default function LoginPage() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  
  // Two-step login state
  const [step, setStep] = useState(1) // 1 = credentials, 2 = captcha
  const [sessionId, setSessionId] = useState(null)
  const [captchaImage, setCaptchaImage] = useState(null)
  const [captchaCode, setCaptchaCode] = useState('')
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [errors, setErrors] = useState({})

  // Warm up backend so first CAPTCHA load feels faster on free-tier hosting.
  useEffect(() => {
    healthCheck().catch(() => {})
  }, [])

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors = {}
    if (!formData.username.trim()) {
      newErrors.username = 'Student ID is required'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Step 1: Submit credentials and get CAPTCHA
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setLoadingMessage('Loading CAPTCHA...')

    try {
      const response = await initLogin(formData.username, formData.password)
      
      if (response.success) {
        setSessionId(response.session_id)
        setCaptchaImage(response.captcha_image)
        setStep(2)
        setCaptchaCode('')
        
        addToast({
          type: 'info',
          title: 'CAPTCHA Required',
          message: 'Please enter the verification code',
        })
      } else {
        addToast({
          type: 'error',
          title: 'Error',
          message: response.message || 'Failed to load CAPTCHA',
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Connection Error',
        message: 'Unable to connect to server. Please try again.',
      })
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }

  // Step 2: Submit CAPTCHA and complete login
  const handleCaptchaSubmit = async (e) => {
    e.preventDefault()
    
    if (!captchaCode.trim()) {
      setErrors({ captcha: 'Please enter the CAPTCHA code' })
      return
    }

    setIsLoading(true)
    setLoadingMessage('Logging in...')
    
    // Progress indicator
    const progressMessages = [
      'Verifying CAPTCHA...',
      'Loading attendance page...',
      'Fetching your data...',
      'Almost there...'
    ]
    let msgIndex = 0
    const progressInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % progressMessages.length
      setLoadingMessage(progressMessages[msgIndex])
    }, 3000)

    try {
      const response = await completeLogin(sessionId, captchaCode)
      
      clearInterval(progressInterval)
      
      if (response.success) {
        setLoadingMessage('Success! Redirecting...')
        
        // Save session (without password) - includes timetable if available
        saveSession({
          studentName: response.student_name,
          subjects: response.subjects,
          timetable: response.timetable || null,
          lastUpdated: new Date().toISOString(),
        })

        addToast({
          type: 'success',
          title: 'Login Successful',
          message: `Welcome back, ${response.student_name}!`,
        })

        // Navigate to dashboard
        navigate('/dashboard')
      } else {
        addToast({
          type: 'error',
          title: 'Login Failed',
          message: response.message || 'Invalid CAPTCHA or credentials',
        })
        
        // Go back to step 1 to retry
        setStep(1)
        setCaptchaImage(null)
        setSessionId(null)
        setCaptchaCode('')
      }
    } catch (error) {
      clearInterval(progressInterval)
      addToast({
        type: 'error',
        title: 'Connection Error',
        message: 'Unable to connect to server. Please try again.',
      })
      setStep(1)
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }

  // Go back to credentials step
  const handleBack = () => {
    setStep(1)
    setCaptchaImage(null)
    setSessionId(null)
    setCaptchaCode('')
    setErrors({})
  }

  // Refresh CAPTCHA (re-initialize login)
  const handleRefreshCaptcha = async () => {
    setIsLoading(true)
    setLoadingMessage('Refreshing CAPTCHA...')
    
    try {
      const response = await initLogin(formData.username, formData.password)
      
      if (response.success) {
        setSessionId(response.session_id)
        setCaptchaImage(response.captcha_image)
        setCaptchaCode('')
      } else {
        addToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to refresh CAPTCHA',
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Connection error',
      })
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }

  return (
    <PageTransition>
      {/* Animated Background (replacing Three.js) */}
      <div className="fixed inset-0 z-background bg-dark-900">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/20 via-dark-900 to-neon-cyan/20 animate-gradient" style={{backgroundSize: '400% 400%'}} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.1),transparent_50%)]" />
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && <LoginLoadingOverlay message={loadingMessage} />}
      </AnimatePresence>

      {/* Login Form */}
      <div className="relative z-content min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-md"
        >
          <GlassCard className="p-8" glow hover={false}>
            {/* Logo & Title */}
            <div className="text-center mb-8">
              <motion.div
                className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-purple via-neon-blue to-neon-cyan p-[2px]"
                animate={{ 
                  boxShadow: [
                    '0 0 20px rgba(168, 85, 247, 0.3)',
                    '0 0 40px rgba(59, 130, 246, 0.4)',
                    '0 0 20px rgba(6, 182, 212, 0.3)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-full h-full bg-dark-800 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl font-black text-white">H</span>
                </div>
              </motion.div>
              
              <h1 className="text-center mb-2">
                <span className="block text-5xl md:text-7xl font-black tracking-tight text-white" style={{fontFamily: "Arial Black, Helvetica, sans-serif"}}>
                  HIYU'S
                </span>
                <span className="block text-5xl md:text-7xl font-black tracking-tight text-white" style={{fontFamily: "Arial Black, Helvetica, sans-serif"}}>
                  ATTENDX
                </span>
              </h1>
              <p className="text-gray-400">
                {step === 1 ? 'Because legends never miss a class.' : 'Enter verification code'}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {/* Step 1: Credentials */}
              {step === 1 && (
                <motion.form
                  key="credentials"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleCredentialsSubmit}
                  className="space-y-6"
                >
                  {/* Student ID Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Student ID</label>
                    <div className="relative group">
                      <HiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-neon-cyan transition-colors" />
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Enter your student ID"
                        className={`
                          w-full pl-12 pr-4 py-3 rounded-xl
                          bg-white/5 border-2 text-white placeholder-gray-500
                          transition-all duration-300
                          focus:outline-none focus:bg-white/10
                          ${errors.username 
                            ? 'border-red-500 focus:border-red-500' 
                            : 'border-white/10 focus:border-neon-cyan focus:shadow-[0_0_20px_rgba(6,182,212,0.3)]'}
                        `}
                      />
                      {/* Animated border glow */}
                      <div className="absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-neon-purple via-neon-blue to-neon-cyan opacity-20 blur-sm" />
                      </div>
                    </div>
                    {errors.username && (
                      <motion.p 
                        className="text-red-400 text-sm"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {errors.username}
                      </motion.p>
                    )}
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Password</label>
                    <div className="relative group">
                      <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-neon-cyan transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        className={`
                          w-full pl-12 pr-12 py-3 rounded-xl
                          bg-white/5 border-2 text-white placeholder-gray-500
                          transition-all duration-300
                          focus:outline-none focus:bg-white/10
                          ${errors.password 
                            ? 'border-red-500 focus:border-red-500' 
                            : 'border-white/10 focus:border-neon-cyan focus:shadow-[0_0_20px_rgba(6,182,212,0.3)]'}
                        `}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showPassword ? (
                          <HiEyeOff className="w-5 h-5" />
                        ) : (
                          <HiEye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <motion.p 
                        className="text-red-400 text-sm"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {errors.password}
                      </motion.p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <AnimatedButton
                    type="submit"
                    fullWidth
                    loading={isLoading}
                    className="mt-8"
                  >
                    <span>Continue</span>
                  </AnimatedButton>
                </motion.form>
              )}

              {/* Step 2: CAPTCHA */}
              {step === 2 && (
                <motion.form
                  key="captcha"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleCaptchaSubmit}
                  className="space-y-6"
                >
                  {/* CAPTCHA Image */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <HiShieldCheck className="w-5 h-5 text-neon-cyan" />
                      Verification Code
                    </label>
                    
                    <div className="flex items-center gap-3">
                      {/* CAPTCHA Image Container */}
                      <div className="flex-1 p-3 bg-white rounded-xl relative overflow-hidden">
                        {captchaImage ? (
                          <img
                            src={`data:image/png;base64,${captchaImage}`}
                            alt="CAPTCHA"
                            className="w-full h-12 object-contain"
                          />
                        ) : (
                          <div className="w-full h-12 flex items-center justify-center text-gray-500">
                            Loading CAPTCHA...
                          </div>
                        )}
                      </div>
                      
                      {/* Refresh Button */}
                      <motion.button
                        type="button"
                        onClick={handleRefreshCaptcha}
                        disabled={isLoading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-3 rounded-xl bg-white/5 border-2 border-white/10 text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/50 transition-all disabled:opacity-50"
                      >
                        <HiRefresh className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                      </motion.button>
                    </div>
                  </div>

                  {/* CAPTCHA Input */}
                  <div className="space-y-2">
                    <div className="relative group">
                      <input
                        type="text"
                        value={captchaCode}
                        onChange={(e) => {
                          setCaptchaCode(e.target.value)
                          if (errors.captcha) setErrors({})
                        }}
                        placeholder="Enter the code shown above"
                        autoFocus
                        className={`
                          w-full px-4 py-3 rounded-xl text-center text-lg tracking-widest font-mono
                          bg-white/5 border-2 text-white placeholder-gray-500
                          transition-all duration-300
                          focus:outline-none focus:bg-white/10
                          ${errors.captcha 
                            ? 'border-red-500 focus:border-red-500' 
                            : 'border-white/10 focus:border-neon-cyan focus:shadow-[0_0_20px_rgba(6,182,212,0.3)]'}
                        `}
                      />
                    </div>
                    {errors.captcha && (
                      <motion.p 
                        className="text-red-400 text-sm text-center"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {errors.captcha}
                      </motion.p>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <motion.button
                      type="button"
                      onClick={handleBack}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-3 px-4 rounded-xl bg-white/5 border-2 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20 transition-all"
                    >
                      Back
                    </motion.button>
                    
                    <div className="flex-1">
                      <AnimatedButton
                        type="submit"
                        fullWidth
                        loading={isLoading}
                      >
                        <span>Verify & Login</span>
                      </AnimatedButton>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Footer Note */}
            <motion.p 
              className="text-center text-gray-500 text-sm mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              🔒 Your credentials are never stored
            </motion.p>
          </GlassCard>

          {/* Additional Info */}
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-gray-500 text-sm">
              Having trouble? Contact your administrator
            </p>
          </motion.div>
        </motion.div>
      </div>
    </PageTransition>
  )
}
