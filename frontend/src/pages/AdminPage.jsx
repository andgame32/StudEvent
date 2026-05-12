import { useEffect, useState } from 'react'
import { api } from '../api'

const roles = ['student', 'teacher', 'moderator', 'admin']
const institutions = ['ИАТ', 'ИРГУПС', 'ПОЛИТЕХ']
const statusLabels = { scheduled: 'Запланирован', live: 'В эфире', ended: 'Завершен' }

function BarChart({ title, data }) {
  const values = Object.entries(data || {})
  const max = Math.max(1, ...values.map(([, value]) => Number(value)))

  return (
    <div className="chart-card">
      <h3>{title}</h3>
      {values.length === 0 && <p>Нет данных</p>}
      {values.map(([label, value]) => (
        <div className="bar-row" key={label}>
          <span>{statusLabels[label] || label || 'не указано'}</span>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${(Number(value) / max) * 100}%` }} /></div>
          <b>{value}</b>
        </div>
      ))}
    </div>
  )
}

function LineChart({ title, rows }) {
  const data = rows || []
  const width = 520
  const height = 160
  const max = Math.max(1, ...data.map((row) => Number(row.total)))
  const points = data.map((row, index) => {
    const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width
    const y = height - (Number(row.total) / max) * (height - 20) - 10
    return { ...row, x, y }
  })
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')

  return (
    <div className="chart-card">
      <h3>{title}</h3>
      {data.length === 0 ? <p>Нет данных</p> : <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
        <path d={path} fill="none" stroke="currentColor" strokeWidth="4" />
        {points.map((point) => <circle key={point.day} cx={point.x} cy={point.y} r="5"><title>{point.day}: {point.total}</title></circle>)}
      </svg>}
    </div>
  )
}

export default function AdminPage() {
  const [users, setUsers] = useState([])
  const [streams, setStreams] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [error, setError] = useState('')

  async function load() {
    try {
      const [usersData, streamsData, metricsData] = await Promise.all([
        api('/admin/users'),
        api('/admin/streams'),
        api('/admin/metrics'),
      ])
      setUsers(usersData)
      setStreams(streamsData)
      setMetrics(metricsData)
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => { queueMicrotask(load) }, [])

  async function toggleBlock(user) {
    await api(`/admin/users/${user.id}/${user.is_blocked ? 'unblock' : 'block'}`, { method: 'POST' })
    load()
  }

  async function updateUser(user, patch) {
    await api(`/admin/users/${user.id}`, { method: 'PUT', body: JSON.stringify(patch) })
    load()
  }

  async function stopStream(stream) {
    await api(`/admin/streams/${stream.id}/stop`, { method: 'POST' })
    load()
  }

  return (
    <section className="page-card admin-page">
      <h1>Админ панель</h1>
      {error && <p className="error-text">{error}</p>}

      {metrics && (
        <>
          <div className="admin-metrics">
            <div className="metric-card"><h3>Стримы</h3><p className="metric-value">{metrics.totals?.streams || 0}</p></div>
            <div className="metric-card"><h3>В эфире</h3><p className="metric-value">{metrics.totals?.live_streams || 0}</p></div>
            <div className="metric-card"><h3>Сообщения</h3><p className="metric-value">{metrics.totals?.messages || 0}</p></div>
            <div className="metric-card"><h3>Пользователи</h3><p className="metric-value">{metrics.totals?.users || 0}</p></div>
          </div>
          <div className="charts-grid">
            <BarChart title="Стримы по статусам" data={metrics.streams_by_status} />
            <BarChart title="Пользователи по ролям" data={metrics.users_by_role} />
            <LineChart title="Сообщения за 7 дней" rows={metrics.messages_by_day} />
          </div>
        </>
      )}

      <h2>Активные стримы</h2>
      <div className="users-list">
        {streams.map((stream) => (
          <div key={stream.id} className="admin-stream-item">
            <div>
              <b>{stream.title}</b>
              <span>{statusLabels[stream.status] || stream.status}</span>
              <small>{stream.user?.name} · {stream.institution || stream.user?.institution || 'без учреждения'}</small>
            </div>
            <button className="danger-btn" disabled={stream.status === 'ended'} onClick={() => stopStream(stream)}>Остановить стрим</button>
          </div>
        ))}
      </div>

      <h2>Пользователи</h2>
      <div className="users-list">
        {users.map((u) => (
          <div key={u.id} className="user-item admin-user-item">
            <div>
              <b>{u.name}</b> ({u.email}) {u.is_blocked ? '[BLOCKED]' : ''}
              <small>Текущая роль: {u.role || 'student'} · {u.institution || 'без учреждения'}</small>
            </div>
            <label>
              Роль
              <select value={u.role || 'student'} onChange={(e) => updateUser(u, { role: e.target.value })}>
                {roles.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </label>
            <label>
              Учреждение
              <select value={u.institution || ''} onChange={(e) => updateUser(u, { institution: e.target.value || null })}>
                <option value="">Не указано</option>
                {institutions.map((institution) => <option key={institution} value={institution}>{institution}</option>)}
              </select>
            </label>
            <button onClick={() => toggleBlock(u)}>
              {u.is_blocked ? 'Разблокировать' : 'Блокировать'}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
