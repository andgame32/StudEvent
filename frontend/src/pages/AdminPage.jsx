import { useEffect, useState } from 'react'
import { api } from '../api'

export default function AdminPage() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')

  async function load() {
    try {
      setUsers(await api('/admin/users'))
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => { load() }, [])

  async function toggleBlock(user) {
    await api(`/admin/users/${user.id}/${user.is_blocked ? 'unblock' : 'block'}`, { method: 'POST' })
    load()
  }

  return <section><h1>Админ панель</h1>{error && <p>{error}</p>}
    {users.map((u) => <div key={u.id}><b>{u.name}</b> ({u.email}) {u.is_blocked ? '[BLOCKED]' : ''}
      <button onClick={() => toggleBlock(u)}>{u.is_blocked ? 'Разблокировать' : 'Блокировать'}</button>
    </div>)}
  </section>
}
