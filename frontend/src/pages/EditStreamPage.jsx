import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

export default function EditStreamPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '', scheduled_at: '', status: 'scheduled', preview: null })
  const [error, setError] = useState('')

  useEffect(() => {
    api(`/streams/${id}`).then((s) => setForm({
      title: s.title,
      description: s.description || '',
      scheduled_at: s.scheduled_at?.slice(0, 16) || '',
      status: s.status,
    }))
  }, [id])

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      const payload = new FormData()
      payload.append('title', form.title)
      payload.append('description', form.description)
      payload.append('scheduled_at', form.scheduled_at)
      payload.append('status', form.status)
      if (form.preview) payload.append('preview', form.preview)
      payload.append('_method', 'PUT')
      await api(`/streams/${id}`, { method: 'POST', body: payload })
      navigate(`/streams/${id}`)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={submit}>
      <h1>Редактирование стрима</h1>
      {error && <p className="error-text">{error}</p>}
      <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, preview: e.target.files?.[0] || null })} />
      <input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
        <option value="live">Идет</option>
        <option value="scheduled">Запланирован</option>
        <option value="ended">Завершен</option>
      </select>
      <button type="submit">Сохранить</button>
    </form>
  )
}
