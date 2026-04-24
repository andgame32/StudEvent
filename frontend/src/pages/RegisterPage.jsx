import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setCurrentUser, setToken } from '../api'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      const data = await api('/register', { method: 'POST', body: JSON.stringify(form) })
      setToken(data.token)
      setCurrentUser(data.user)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <h2>Регистрация</h2>
      {error && <p className="error-text">{error}</p>}
      <input placeholder="Имя" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input placeholder="Пароль" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <input placeholder="Подтверждение пароля" type="password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} />
      <button type="submit">Создать аккаунт</button>
      <Link to="/login">Уже есть аккаунт?</Link>
    </form>
  )
}
