import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { useSettings } from '../settings'

const rtcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }

function normalizeSdp(rawSdp) {
  if (!rawSdp || typeof rawSdp !== 'string') return ''

  const normalized = rawSdp
    .replace(/\r?\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\r\n')

  return normalized.endsWith('\r\n') ? normalized : `${normalized}\r\n`
}

export default function VideoPlayer({ streamId, isHost, isEnded = false }) {
  const localRef = useRef(null)
  const remoteRef = useRef(null)
  const peerRef = useRef(null)
  const [started, setStarted] = useState(false)
  const [error, setError] = useState('')
  const { t } = useSettings()

  useEffect(() => () => peerRef.current?.close(), [])

  async function pollCandidates(roleToRead) {
    let processed = 0
    const timer = setInterval(async () => {
      try {
        const data = await api(`/streams/${streamId}/signal/candidates?role=${roleToRead}`)
        const next = (data.candidates || []).slice(processed)
        for (const c of next) {
          await peerRef.current?.addIceCandidate(c).catch(() => null)
        }
        processed += next.length
      } catch {
        // ignore
      }
    }, 2000)
    return () => clearInterval(timer)
  }

  async function startHost() {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
    localRef.current.srcObject = stream
    const pc = new RTCPeerConnection(rtcConfig)
    peerRef.current = pc

    stream.getTracks().forEach((track) => pc.addTrack(track, stream))
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        api(`/streams/${streamId}/signal/candidates`, {
          method: 'POST',
          body: JSON.stringify({ role: 'host', candidate: event.candidate }),
        })
      }
    }

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    await api(`/streams/${streamId}/signal/offer`, {
      method: 'POST',
      body: JSON.stringify({ sdp: normalizeSdp(pc.localDescription?.sdp || offer.sdp) }),
    })


    const stopPoll = await pollCandidates('viewer')
    const answerLoop = setInterval(async () => {
      const answerData = await api(`/streams/${streamId}/signal/answer`)
      if (answerData.sdp) {
        await pc.setRemoteDescription({ type: 'answer', sdp: normalizeSdp(answerData.sdp) })
        clearInterval(answerLoop)
        setStarted(true)
      }
    }, 2000)

    return () => {
      clearInterval(answerLoop)
      stopPoll()
    }
  }

  async function startViewer() {
    const pc = new RTCPeerConnection(rtcConfig)
    peerRef.current = pc

    pc.ontrack = (event) => {
      if (remoteRef.current) remoteRef.current.srcObject = event.streams[0]
    }
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        api(`/streams/${streamId}/signal/candidates`, {
          method: 'POST',
          body: JSON.stringify({ role: 'viewer', candidate: event.candidate }),
        })
      }
    }

    const offerData = await api(`/streams/${streamId}/signal/offer`)
    if (!offerData.sdp) return
    await pc.setRemoteDescription({ type: 'offer', sdp: normalizeSdp(offerData.sdp) })
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    await api(`/streams/${streamId}/signal/answer`, {
      method: 'POST',
      body: JSON.stringify({ sdp: normalizeSdp(pc.localDescription?.sdp || answer.sdp) }),
    })
    await pollCandidates('host')
    setStarted(true)
  }

  async function start() {
    if (isEnded) return
    setError('')
    try {
      if (isHost) await startHost()
      else await startViewer()
    } catch (err) {
      setError(err.message || 'Ошибка запуска трансляции')
    }
  }

  return (
    <section className="video-player">
      <button onClick={start} disabled={isEnded}>{started ? t('reconnect') : isHost ? t('startLive') : t('connect')}</button>
      {error && <p className="error-text">{error}</p>}
      {isHost && <video ref={localRef} autoPlay muted playsInline className="video" />}
      <video ref={remoteRef} autoPlay playsInline className="video" />
    </section>
  )
}
