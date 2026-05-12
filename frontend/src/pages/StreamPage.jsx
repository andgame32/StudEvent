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
  const [error, setError] = useState('')
  const [reactionError, setReactionError] = useState('')
  const [reactionLoading, setReactionLoading] = useState('')
  const { t } = useSettings()

  useEffect(() => {
    let active = true

    async function loadStream() {
      try {
        const [streamData, meData] = await Promise.all([
          api(`/streams/${id}`),
          api('/me').catch(() => null),
        ])
        if (!active) return
        setStream(streamData)
        setMe(meData)
        setError('')
      } catch (e) {
        if (!active) return
        setError(e.message)
      }
    }

    loadStream()
    const interval = setInterval(async () => {
      const fresh = await api(`/streams/${id}`).catch(() => null)
      if (active && fresh) setStream(fresh)
    }, 3000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [id])

  if (error) return <div className="page-card"><p className="error-text">{error}</p></div>
  if (!stream) return <p>{t('loading')}</p>

  const isHost = me?.id === stream.user_id
  const isEnded = stream.status === 'ended'

  async function endStream() {
    if (!isHost) return
    const updated = await api(`/streams/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'ended' }) })
    setStream(updated)
  }

  async function react(reaction) {
    if (!me) {
      setReactionError(t('loginToReact'))
      return
    }

    setReactionLoading(reaction)
    setReactionError('')

    try {
      const updated = await api(`/streams/${id}/react`, {
        method: 'POST',
        body: JSON.stringify({ reaction }),
      })
      setStream(updated)
    } catch (e) {
      setReactionError(e.message)
    } finally {
      setReactionLoading('')
    }
  }

  return (
    <div className="page-card stream-page-card">
      <h1>{stream.title}</h1>
      {isEnded && <div className="ended-banner">{t('streamEndedBanner')}</div>}
      <p>{stream.description}</p>
      <p>{t('status')}: {stream.status}</p>
      <p>Учреждение: {stream.institution || stream.user?.institution || 'не указано'}</p>
      <VideoPlayer streamId={id} isHost={isHost} isEnded={isEnded} onEnded={setStream} />
      <section className="stream-reactions" aria-label={t('reactions')}>
        <button
          className={`reaction-btn${stream.current_user_reaction === 'like' ? ' active' : ''}`}
          type="button"
          onClick={() => react('like')}
          disabled={reactionLoading === 'like'}
        >
          👍 {t('like')} <span>{stream.likes_count ?? 0}</span>
        </button>
        <button
          className={`reaction-btn${stream.current_user_reaction === 'dislike' ? ' active' : ''}`}
          type="button"
          onClick={() => react('dislike')}
          disabled={reactionLoading === 'dislike'}
        >
          👎 {t('dislike')} <span>{stream.dislikes_count ?? 0}</span>
        </button>
      </section>
      {reactionError && <p className="error-text">{reactionError}</p>}
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
