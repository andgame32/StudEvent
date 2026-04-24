import { useEffect, useState } from 'react'
import { api, getCurrentUser, setCurrentUser } from '../api'

export default function ProfilePage() {
  const [user, setUser] = useState(getCurrentUser())
  const [accounts, setAccounts] = useState([])
  const [name, setName] = useState('')
  const [role, setRole] = useState('')

  useEffect(() => {
    api('/me')
      .then((data) => {
        setUser(data)
        setCurrentUser(data)
      })
      .catch(() => setUser(getCurrentUser()))
    api('/related-accounts').then(setAccounts).catch(() => setAccounts([]))
  }, [])

  async function addAccount(e) {
    e.preventDefault()
    if (!name.trim()) return
    const created = await api('/related-accounts', {
      method: 'POST',
      body: JSON.stringify({ name, role }),
    })
    setAccounts((prev) => [created, ...prev].slice(0, 3))
    setName('')
    setRole('')
  }

  if (!user) return <p>Войдите, чтобы увидеть профиль.</p>
  return (
    <div>
      <h1>Профиль</h1>
      <p>Имя: {user.name}</p>
      <p>Email: {user.email}</p>
      <h2>Связанные аккаунты (до 3 в sidebar)</h2>
      {accounts.map((acc) => <p key={acc.id}>{acc.name} - {acc.role || 'Участник'}</p>)}
      <form onSubmit={addAccount}>
        <input placeholder="Имя аккаунта" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Роль/должность" value={role} onChange={(e) => setRole(e.target.value)} />
        <button type="submit">Добавить аккаунт</button>
      </form>
    </div>
  )
}
