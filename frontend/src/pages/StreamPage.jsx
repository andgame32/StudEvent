import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import Chat from '../components/Chat'
import VideoPlayer from '../components/VideoPlayer'
import { useSettings } from '../settings'

export default function StreamPage() {
  const { id } = useParams()
  const [stream, setStream] = useState(null)
  const [me, setMe] = useState(null)
  const { t } = useSettings()

  useEffect(() => {
    api(`/streams/${id}`).then(setStream)
    api('/me').then(setMe).catch(() => setMe(null))
  }, [id])

  async function endStream() {
    if (!isHost) return
    const updated = await api(`/streams/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'ended' }),
    })
    setStream(updated)
  }

  if (!stream) return <p>Загрузка...</p>
  const isHost = me?.id === stream.user_id

  return (
    <div>
      <h1>{stream.title}</h1>
      {stream.preview_url && <img className="stream-preview" src={stream.preview_url} alt={stream.title} />}
      <p>{stream.description}</p>
      <p>Статус: {stream.status}</p>
      <p>{stream.status === 'ended' ? t('streamEnded') : isHost ? t('streamStartHint') : t('streamWatchHint')}</p>
      <VideoPlayer streamId={id} isHost={isHost} isEnded={stream.status === 'ended'} />
      <Chat streamId={id} />
      {isHost && (
        <div className="row-actions">
          <button className="danger-btn" onClick={endStream}>{t('endStream')}</button>
          <Link to={`/streams/${id}/edit`}>Редактировать</Link>
        </div>
      )}
    </div>
  )
}
