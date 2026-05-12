import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api'
import { useSettings } from '../settings'

const defaultIceServers = [{ urls: 'stun:stun.l.google.com:19302' }]

function getIceServers() {
  const raw = import.meta.env.VITE_ICE_SERVERS
  if (!raw) return defaultIceServers

  try {
    const parsed = JSON.parse(raw)
    const servers = Array.isArray(parsed) ? parsed : []
    return servers.slice(0, 4)
  } catch {
    return defaultIceServers
  }
}

const rtcConfig = { iceServers: getIceServers(), iceCandidatePoolSize: 2 }
const normalizeSdp = (rawSdp) => (rawSdp || '').replace(/\r?\n/g, '\n').split('\n').map((line) => line.trim()).filter(Boolean).join('\r\n') + '\r\n'

export default function VideoPlayer({ streamId, isHost, isEnded = false, onEnded }) {
  const localRef = useRef(null)
  const remoteRef = useRef(null)
  const hostPeersRef = useRef(new Map())
  const viewerPeerRef = useRef(null)
  const localStreamRef = useRef(null)
  const pollRef = useRef(null)
  const statusPollRef = useRef(null)
  const [started, setStarted] = useState(false)
  const [error, setError] = useState('')
  const [paused, setPaused] = useState(false)
  const { t } = useSettings()
  const viewerId = useMemo(() => crypto.randomUUID(), [])

  function stopConnection() {
    if (pollRef.current) clearInterval(pollRef.current)
    if (statusPollRef.current) clearInterval(statusPollRef.current)
    pollRef.current = null
    statusPollRef.current = null
    hostPeersRef.current.forEach((pc) => pc.close())
    hostPeersRef.current.clear()
    viewerPeerRef.current?.close()
    viewerPeerRef.current = null
    localStreamRef.current?.getTracks().forEach((track) => track.stop())
    localStreamRef.current = null
    if (localRef.current) localRef.current.srcObject = null
    if (remoteRef.current) remoteRef.current.srcObject = null
    setStarted(false)
    setPaused(false)
  }

  useEffect(() => stopConnection, [])

  useEffect(() => {
    if (isEnded) queueMicrotask(stopConnection)
  }, [isEnded])

  function watchPeer(pc) {
    pc.oniceconnectionstatechange = () => {
      if (['failed', 'disconnected'].includes(pc.iceConnectionState)) {
        setError('ICE-соединение не установлено. Проверьте TURN-сервер в VITE_ICE_SERVERS и доступность сети.')
      }
    }
  }

  function startStatusPolling() {
    if (statusPollRef.current) clearInterval(statusPollRef.current)
    statusPollRef.current = setInterval(async () => {
      const fresh = await api(`/streams/${streamId}`).catch(() => null)
      if (fresh?.status === 'ended') {
        stopConnection()
        onEnded?.(fresh)
      }
    }, 2000)
  }

  async function startHost() {
    const media = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
    localStreamRef.current = media
    localRef.current.srcObject = media
    media.getTracks().forEach((track) => {
      track.onended = () => stopConnection()
    })
    const tracks = media.getTracks()

    async function processOffers() {
      const data = await api(`/streams/${streamId}/signal/answer`).catch(() => ({ offers: {} }))
      const offers = data?.offers || {}
      for (const [incomingViewerId, sdp] of Object.entries(offers)) {
        if (!sdp || hostPeersRef.current.has(incomingViewerId)) continue
        const pc = new RTCPeerConnection(rtcConfig)
        watchPeer(pc)
        hostPeersRef.current.set(incomingViewerId, pc)
        tracks.forEach((track) => pc.addTrack(track, media))
        pc.onicecandidate = (event) => event.candidate && api(`/streams/${streamId}/signal/candidates`, { method: 'POST', body: JSON.stringify({ role: 'host', viewer_id: incomingViewerId, candidate: event.candidate }) })
        await pc.setRemoteDescription({ type: 'offer', sdp: normalizeSdp(sdp) })
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        await api(`/streams/${streamId}/signal/offer`, { method: 'POST', body: JSON.stringify({ viewer_id: incomingViewerId, sdp: normalizeSdp(pc.localDescription?.sdp || answer.sdp) }) })
      }

      for (const [connectedViewerId, pc] of hostPeersRef.current.entries()) {
        const c = await api(`/streams/${streamId}/signal/candidates?role=viewer&viewer_id=${connectedViewerId}`).catch(() => ({ candidates: [] }))
        for (const candidate of c?.candidates || []) {
          try { await pc.addIceCandidate(candidate) } catch { /* stale ICE candidate */ }
        }
      }
    }

    await processOffers()
    pollRef.current = setInterval(processOffers, 1000)
  }

  async function startViewer() {
    const pc = new RTCPeerConnection(rtcConfig)
    watchPeer(pc)
    viewerPeerRef.current = pc
    pc.addTransceiver('video', { direction: 'recvonly' })
    pc.addTransceiver('audio', { direction: 'recvonly' })
    pc.ontrack = (event) => { if (remoteRef.current) remoteRef.current.srcObject = event.streams[0] }
    pc.onicecandidate = (event) => event.candidate && api(`/streams/${streamId}/signal/candidates`, { method: 'POST', body: JSON.stringify({ role: 'viewer', viewer_id: viewerId, candidate: event.candidate }) })

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    await api(`/streams/${streamId}/signal/answer`, { method: 'POST', body: JSON.stringify({ viewer_id: viewerId, sdp: normalizeSdp(pc.localDescription?.sdp || offer.sdp) }) })

    async function pollAnswer() {
      const answerData = await api(`/streams/${streamId}/signal/offer?viewer_id=${viewerId}`).catch(() => ({ sdp: null }))
      if (answerData?.sdp && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription({ type: 'answer', sdp: normalizeSdp(answerData.sdp) })
      }
      const c = await api(`/streams/${streamId}/signal/candidates?role=host&viewer_id=${viewerId}`).catch(() => ({ candidates: [] }))
      for (const candidate of c?.candidates || []) {
        try { await pc.addIceCandidate(candidate) } catch { /* stale ICE candidate */ }
      }
    }

    await pollAnswer()
    pollRef.current = setInterval(pollAnswer, 1000)
  }

  async function start() {
    if (isEnded) return
    setError('')
    try {
      stopConnection()
      isHost ? await startHost() : await startViewer()
      startStatusPolling()
      setStarted(true)
    } catch (e) { setError(e.message || t('streamStartError')) }
  }

  function togglePauseViewer() {
    if (isHost || !remoteRef.current) return
    if (paused) remoteRef.current.play()
    else remoteRef.current.pause()
    setPaused(!paused)
  }

  return <section className="video-player">{!isEnded && <button onClick={start}>{started ? t('reconnect') : isHost ? t('startLive') : t('connect')}</button>}{started && <button type="button" className="secondary-btn" onClick={stopConnection}>{isHost ? 'Остановить трансляцию у себя' : 'Отключиться'}</button>}{!isHost && started && <button onClick={togglePauseViewer}>{paused ? 'Возобновить для меня' : 'Пауза для меня'}</button>}{error && <p className="error-text">{error}</p>}{isHost && <video ref={localRef} autoPlay muted playsInline className="video" />}<video ref={remoteRef} autoPlay playsInline className="video" /></section>
}
