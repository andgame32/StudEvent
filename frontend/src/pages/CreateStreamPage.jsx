import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

const MAX_W = 1280
const MAX_H = 720

async function cropPreview(file) {
  if (!file) return null
  const img = await new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = URL.createObjectURL(file)
  })

  const targetRatio = MAX_W / MAX_H
  const sourceRatio = img.width / img.height
  let sw = img.width
  let sh = img.height
  let sx = 0
  let sy = 0

  if (sourceRatio > targetRatio) {
    sw = Math.round(img.height * targetRatio)
    sx = Math.floor((img.width - sw) / 2)
  } else {
    sh = Math.round(img.width / targetRatio)
    sy = Math.floor((img.height - sh) / 2)
  }

  const canvas = document.createElement('canvas')
  canvas.width = MAX_W
  canvas.height = MAX_H
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, MAX_W, MAX_H)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.92)
  })
}

export default function CreateStreamPage() {
  const [form, setForm] = useState({ title: '', description: '', scheduled_at: '', status: 'scheduled', preview: null })
  const [error, setError] = useState('')
  const navigate = useNavigate()

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
      const stream = await api('/streams', { method: 'POST', body: payload })
      navigate(`/streams/${stream.id}`)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={submit}>
      <h1>Создание стрима</h1>
      {error && <p className="error-text">{error}</p>}
      <input placeholder="Название" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <textarea placeholder="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <input type="file" accept="image/*" onChange={async (e) => setForm({ ...form, preview: await cropPreview(e.target.files?.[0] || null) })} />
      <input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
        <option value="live">Идет</option>
        <option value="scheduled">Запланирован</option>
        <option value="ended">Завершен</option>
      </select>
      <button type="submit">Создать</button>
    </form>
  )
}
