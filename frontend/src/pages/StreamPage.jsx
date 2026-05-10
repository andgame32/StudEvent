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
  useEffect(() => { api(`/streams/${id}`).then(setStream); api('/me').then(setMe).catch(() => setMe(null)) }, [id])
  if (!stream) return <p>{t('loading')}</p>
  const isHost = me?.id === stream.user_id
  const isEnded = stream.status === 'ended'
  async function endStream() { if (!isHost) return; const updated = await api(`/streams/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'ended', host_offer: null, viewer_answer: null }) }); setStream(updated) }

  return <div className="page-card"><h1>{stream.title}</h1>{isEnded && <div className="ended-banner">{t('streamEndedBanner')}</div>}<p>{stream.description}</p><p>{t('status')}: {stream.status}</p><VideoPlayer streamId={id} isHost={isHost} isEnded={isEnded} /><Chat streamId={id} stream={stream} me={me} />{isHost && !isEnded && <div className="row-actions"><button className="danger-btn" onClick={endStream}>{t('endStream')}</button><Link to={`/streams/${id}/edit`}>{t('edit')}</Link></div>}</div>
}
