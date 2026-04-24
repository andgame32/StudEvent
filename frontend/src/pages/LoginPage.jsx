import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setCurrentUser, setToken } from '../api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      const data = await api('/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      setToken(data.token)
      setCurrentUser(data.user)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <h2>Вход</h2>
      {error && <p className="error-text">{error}</p>}
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="Пароль" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Войти</button>
      <Link to="/register">Нет аккаунта?</Link>
    </form>
  )
}
