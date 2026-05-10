import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { useSettings } from '../settings'

const rtcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
const normalizeSdp = (rawSdp) => (rawSdp || '').replace(/\r?\n/g, '\n').split('\n').map((line) => line.trim()).filter(Boolean).join('\r\n') + '\r\n'

export default function VideoPlayer({ streamId, isHost, isEnded = false }) {
  const localRef = useRef(null)
  const remoteRef = useRef(null)
  const peerRef = useRef(null)
  const [started, setStarted] = useState(false)
  const [error, setError] = useState('')
  const { t } = useSettings()

  useEffect(() => () => peerRef.current?.close(), [])

  async function start() {
    if (isEnded) return
    setError('')
    try {
      const pc = new RTCPeerConnection(rtcConfig)
      peerRef.current = pc
      if (isHost) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        localRef.current.srcObject = stream
        stream.getTracks().forEach((track) => pc.addTrack(track, stream))
      } else {
        pc.ontrack = (event) => { if (remoteRef.current) remoteRef.current.srcObject = event.streams[0] }
      }
      pc.onicecandidate = (event) => event.candidate && api(`/streams/${streamId}/signal/candidates`, { method: 'POST', body: JSON.stringify({ role: isHost ? 'host' : 'viewer', candidate: event.candidate }) })
      if (isHost) {
        const offer = await pc.createOffer(); await pc.setLocalDescription(offer)
        await api(`/streams/${streamId}/signal/offer`, { method: 'POST', body: JSON.stringify({ sdp: normalizeSdp(pc.localDescription?.sdp || offer.sdp) }) })
      } else {
        const offerData = await api(`/streams/${streamId}/signal/offer`); if (!offerData.sdp) return
        await pc.setRemoteDescription({ type: 'offer', sdp: normalizeSdp(offerData.sdp) })
        const answer = await pc.createAnswer(); await pc.setLocalDescription(answer)
        await api(`/streams/${streamId}/signal/answer`, { method: 'POST', body: JSON.stringify({ sdp: normalizeSdp(pc.localDescription?.sdp || answer.sdp) }) })
      }
      setStarted(true)
    } catch (e) { setError(e.message || t('streamStartError')) }
  }

  return <section className="video-player">{!isEnded && <button onClick={start}>{started ? t('reconnect') : isHost ? t('startLive') : t('connect')}</button>}{error && <p className="error-text">{error}</p>}{isHost && <video ref={localRef} autoPlay muted playsInline className="video" />}<video ref={remoteRef} autoPlay playsInline className="video" /></section>
}
