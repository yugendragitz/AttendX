// Local storage utilities for session management

const SESSION_KEY = 'attendx_session'
const THEME_KEY = 'attendx_theme'

/**
 * Save session data to localStorage
 * NOTE: Password is NEVER stored
 * @param {Object} data - Session data (studentName, subjects, timetable, lastUpdated)
 */
export function saveSession(data) {
  try {
    const sessionData = {
      studentName: data.studentName,
      subjects: data.subjects,
      timetable: data.timetable || null,
      lastUpdated: data.lastUpdated || new Date().toISOString(),
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData))
  } catch (error) {
    console.error('Failed to save session:', error)
  }
}

/**
 * Get session data from localStorage
 * @returns {Object|null} - Session data or null if not found
 */
export function getSession() {
  try {
    const data = localStorage.getItem(SESSION_KEY)
    if (!data) return null
    
    const session = JSON.parse(data)
    
    // Check if session is expired (24 hours)
    const lastUpdated = new Date(session.lastUpdated)
    const now = new Date()
    const hoursDiff = (now - lastUpdated) / (1000 * 60 * 60)
    
    if (hoursDiff > 24) {
      clearSession()
      return null
    }
    
    return session
  } catch (error) {
    console.error('Failed to get session:', error)
    return null
  }
}

/**
 * Clear session data from localStorage
 */
export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch (error) {
    console.error('Failed to clear session:', error)
  }
}

/**
 * Check if a session exists
 * @returns {boolean}
 */
export function hasSession() {
  return getSession() !== null
}

/**
 * Save theme preference
 * @param {string} theme - 'dark' or 'light'
 */
export function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch (error) {
    console.error('Failed to save theme:', error)
  }
}

/**
 * Get theme preference
 * @returns {string} - 'dark' or 'light'
 */
export function getTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || 'dark'
  } catch {
    return 'dark'
  }
}
