// API client for communicating with the FastAPI backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 45000)

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Step 1: Initialize login and get CAPTCHA image
 * @param {string} username - Student ID
 * @param {string} password - Password
 * @returns {Promise<Object>} - Contains session_id and captcha_image (base64)
 */
export async function initLogin(username, password) {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/init-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    }, 60000)

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return {
        success: false,
        message: data.detail || data.message || 'Failed to load CAPTCHA',
      }
    }

    return {
      success: true,
      session_id: data.session_id,
      captcha_image: data.captcha_image,
    }
  } catch (error) {
    console.error('API Error:', error)
    if (error.name === 'AbortError') {
      return {
        success: false,
        message: 'Server is taking too long. It may be waking up, please retry in a few seconds.',
      }
    }
    return {
      success: false,
      message: 'Connection error. Please check if the server is running.',
    }
  }
}

/**
 * Step 2: Complete login with CAPTCHA code
 * @param {string} sessionId - Session ID from initLogin
 * @param {string} captchaCode - CAPTCHA code entered by user
 * @returns {Promise<Object>} - Attendance data or error
 */
export async function completeLogin(sessionId, captchaCode) {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/complete-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session_id: sessionId, captcha_code: captchaCode }),
    }, 90000)

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return {
        success: false,
        message: data.detail || data.message || 'Login failed',
      }
    }

    return {
      success: true,
      student_name: data.student_name || 'Student',
      subjects: data.subjects || [],
      timetable: data.timetable || null,
    }
  } catch (error) {
    console.error('API Error:', error)
    if (error.name === 'AbortError') {
      return {
        success: false,
        message: 'Login is taking too long. Please try once more.',
      }
    }
    return {
      success: false,
      message: 'Connection error. Please try again.',
    }
  }
}

/**
 * Legacy: Login and fetch attendance data (single step - for portals without CAPTCHA)
 * @param {string} username - Student ID
 * @param {string} password - Password
 * @returns {Promise<Object>} - Attendance data or error
 */
export async function loginAndFetchAttendance(username, password) {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    }, 90000)

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return {
        success: false,
        message: data.detail || data.message || 'Login failed',
      }
    }

    return {
      success: true,
      student_name: data.student_name || 'Student',
      subjects: data.subjects || [],
    }
  } catch (error) {
    console.error('API Error:', error)

    if (error.name === 'AbortError') {
      return {
        success: false,
        message: 'Request timed out. Please retry.',
      }
    }
    
    // For demo purposes, return mock data if server is not running
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      console.log('Server not running, returning demo data...')
      return getDemoData(username)
    }
    
    return {
      success: false,
      message: 'Connection error. Please check if the server is running.',
    }
  }
}

/**
 * Get demo data for testing without backend
 * @param {string} username - Student ID
 * @returns {Object} - Mock attendance data
 */
function getDemoData(username) {
  // Generate random attendance between 50-95
  const generateAttendance = () => Math.floor(Math.random() * 46) + 50

  return {
    success: true,
    student_name: username || 'Demo Student',
    subjects: [
      { name: 'Mathematics', attendance: generateAttendance(), totalClasses: 40, attendedClasses: 34 },
      { name: 'Physics', attendance: generateAttendance(), totalClasses: 35, attendedClasses: 25 },
      { name: 'Chemistry', attendance: generateAttendance(), totalClasses: 38, attendedClasses: 35 },
      { name: 'Computer Science', attendance: generateAttendance(), totalClasses: 42, attendedClasses: 38 },
      { name: 'English', attendance: generateAttendance(), totalClasses: 30, attendedClasses: 24 },
      { name: 'Electronics', attendance: generateAttendance(), totalClasses: 36, attendedClasses: 28 },
    ],
  }
}

/**
 * Health check for the API
 * @returns {Promise<boolean>} - True if API is healthy
 */
export async function healthCheck() {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/health`, {}, 10000)
    return response.ok
  } catch {
    return false
  }
}
