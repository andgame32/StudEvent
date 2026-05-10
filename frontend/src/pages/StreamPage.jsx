import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, toAbsoluteUrl } from '../api'
import Chat from '../components/Chat'
import VideoPlayer from '../components/VideoPlayer'
import { useSettings } from '../settings'

export default function StreamPage() {
  const { id } = useParams()
  const [stream, setStream] = useState(null)
  const [me, setMe] = useState(null)
  const { t } = useSettings()

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const [streamData, meData] = await Promise.all([
          api(`/streams/${id}`),
          api('/me').catch(() => null),
        ])
        if (!mounted) return
        setStream(streamData)
        setMe(meData)
      } catch {
        // ignore polling errors
      }
    }

    load()
    const timer = setInterval(load, 3000)
    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [id])

  async function endStream() {
    if (!isHost) return
    const updated = await api(`/streams/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'ended', host_offer: null, viewer_answer: null }),
    })
    setStream(updated)
  }

  if (!stream) return <p>{t('loading')}</p>

  const isHost = me?.id === stream.user_id
  const isEnded = stream.status === 'ended'

  return (
    <div className="page-card">
      <h1>{stream.title}</h1>
      {isEnded && <div className="ended-banner">{t('streamEndedBanner')}</div>}
      {stream.preview_url && <img className="stream-preview" src={toAbsoluteUrl(stream.preview_url)} alt={stream.title} />}
      <p>{stream.description}</p>
      <p>{t('status')}: {stream.status}</p>

      <VideoPlayer streamId={id} isHost={isHost} isEnded={isEnded} />
      <Chat streamId={id} stream={stream} me={me} />

      {isHost && !isEnded && (
        <div className="row-actions">
          <button className="danger-btn" onClick={endStream}>{t('endStream')}</button>
          <Link to={`/streams/${id}/edit`}>{t('edit')}</Link>
        </div>
      )}
    </div>
  )
}
