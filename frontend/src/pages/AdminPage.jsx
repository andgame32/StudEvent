import { useEffect, useState } from 'react'
import { api } from '../api'

export default function AdminPage() {
  const [users, setUsers] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [error, setError] = useState('')

  async function load() {
    try {
      setUsers(await api('/admin/users'))
      setMetrics(await api('/admin/metrics'))
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

  return (
    <section className="page-card">
      <h1>Админ панель</h1>
      {error && <p style={{ color: '#d32f2f' }}>{error}</p>}
      
      {metrics && (
        <div className="admin-metrics">
          <div className="metric-card">
            <h3>Всего посещений</h3>
            <p className="metric-value">{metrics.total_visits || 0}</p>
          </div>
          <div className="metric-card">
            <h3>Всего сообщений</h3>
            <p className="metric-value">{metrics.total_messages || 0}</p>
          </div>
        </div>
      )}

      <h2>Пользователи</h2>
      <div className="users-list">
        {users.map((u) => (
          <div key={u.id} className="user-item">
            <div>
              <b>{u.name}</b> ({u.email}) {u.is_blocked ? '[BLOCKED]' : ''}
            </div>
            <button onClick={() => toggleBlock(u)}>
              {u.is_blocked ? 'Разблокировать' : 'Блокировать'}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
