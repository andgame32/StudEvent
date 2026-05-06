const API_URL = import.meta.env.VITE_API_BASE || '/api'

export function getToken() {
  return localStorage.getItem('token')
}

export function setToken(token) {
  if (token) localStorage.setItem('token', token)
}

export function clearToken() {
  localStorage.removeItem('token')
}

export function getCurrentUser() {
  const raw = localStorage.getItem('current_user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setCurrentUser(user) {
  if (!user) return
  localStorage.setItem('current_user', JSON.stringify(user))
}

export function clearCurrentUser() {
  localStorage.removeItem('current_user')
}

export async function api(path, options = {}) {
  const token = getToken()
  const isFormData = options.body instanceof FormData
  const baseHeaders = isFormData ? {} : { 'Content-Type': 'application/json' }

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      ...baseHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const textError = data.message || Object.values(data.errors || {}).flat()?.[0] || 'Request failed'
    throw new Error(textError)
  }
  return data
}

export function toAbsoluteUrl(url) {
  if (!url) return null
  if (/^https?:\/\//.test(url)) return url
  const base = import.meta.env.VITE_BACKEND_ORIGIN || window.location.origin
  return new URL(url, base).toString()
}

// test git