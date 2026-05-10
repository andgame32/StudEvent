import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api'
import { useSettings } from '../settings'

const rtcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
const normalizeSdp = (rawSdp) => (rawSdp || '').replace(/\r?\n/g, '\n').split('\n').map((line) => line.trim()).filter(Boolean).join('\r\n') + '\r\n'

export default function VideoPlayer({ streamId, isHost, isEnded = false }) {
  const localRef = useRef(null)
  const remoteRef = useRef(null)
  const hostPeersRef = useRef(new Map())
  const viewerPeerRef = useRef(null)
  const pollRef = useRef(null)
  const [started, setStarted] = useState(false)
  const [error, setError] = useState('')
  const [paused, setPaused] = useState(false)
  const { t } = useSettings()
  const viewerId = useMemo(() => crypto.randomUUID(), [streamId])

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current)
    hostPeersRef.current.forEach((pc) => pc.close())
    viewerPeerRef.current?.close()
  }, [])

  async function startHost() {
    const media = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
    localRef.current.srcObject = media
    const tracks = media.getTracks()

    async function processOffers() {
      const data = await api(`/streams/${streamId}/signal/answer`).catch(() => ({ offers: {} }))
      const offers = data?.offers || {}
      for (const [incomingViewerId, sdp] of Object.entries(offers)) {
        if (!sdp || hostPeersRef.current.has(incomingViewerId)) continue
        const pc = new RTCPeerConnection(rtcConfig)
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
          try { await pc.addIceCandidate(candidate) } catch {}
        }
      }
    }

    await processOffers()
    pollRef.current = setInterval(processOffers, 1000)
  }

  async function startViewer() {
    const pc = new RTCPeerConnection(rtcConfig)
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
        try { await pc.addIceCandidate(candidate) } catch {}
      }
    }

    await pollAnswer()
    pollRef.current = setInterval(pollAnswer, 1000)
  }

  async function start() {
    if (isEnded) return
    setError('')
    try {
      if (pollRef.current) clearInterval(pollRef.current)
      isHost ? await startHost() : await startViewer()
      setStarted(true)
    } catch (e) { setError(e.message || t('streamStartError')) }
  }

  function togglePauseViewer() {
    if (isHost || !remoteRef.current) return
    if (paused) remoteRef.current.play()
    else remoteRef.current.pause()
    setPaused(!paused)
  }

  return <section className="video-player">{!isEnded && <button onClick={start}>{started ? t('reconnect') : isHost ? t('startLive') : t('connect')}</button>}{!isHost && started && <button onClick={togglePauseViewer}>{paused ? 'Возобновить для меня' : 'Пауза для меня'}</button>}{error && <p className="error-text">{error}</p>}{isHost && <video ref={localRef} autoPlay muted playsInline className="video" />}<video ref={remoteRef} autoPlay playsInline className="video" /></section>
}
