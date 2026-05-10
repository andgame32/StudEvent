import { useEffect, useState } from 'react'
import { api, toAbsoluteUrl } from '../api'
import { useSettings } from '../settings'

export default function Chat({ streamId, stream, me }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [lastId, setLastId] = useState(0)
  const { t } = useSettings()

  useEffect(() => { const timer = setInterval(async () => { try { const incoming = await api(`/streams/${streamId}/messages?since_id=${lastId}`); if (incoming.length) { setMessages((prev) => [...prev, ...incoming]); setLastId(incoming[incoming.length - 1].id) } } catch {} }, 2000); return () => clearInterval(timer) }, [streamId, lastId])

  async function sendMessage(e) { e.preventDefault(); if (!text.trim() || stream?.status === 'ended') return; const created = await api(`/streams/${streamId}/messages`, { method: 'POST', body: JSON.stringify({ text }) }); setMessages((prev) => [...prev, created]); setLastId(created.id); setText('') }
  async function blockUser(userId) { const minutes = Number(prompt(t('blockMinutesPrompt'), '30') || 0); if (!minutes) return; await api(`/streams/${streamId}/moderation/block`, { method: 'POST', body: JSON.stringify({ user_id: userId, minutes }) }) }
  const canModerate = ['moderator', 'admin'].includes(me?.role) || me?.is_admin

  return (<section className="chat"><h3>{t('chat')}</h3><div className="chat-messages">{messages.map((m) => <p key={m.id}><img src={m.user?.avatar_url ? toAbsoluteUrl(m.user.avatar_url) : 'https://placehold.co/24x24'} alt="" width="24" height="24" style={{ borderRadius: '50%', verticalAlign: 'middle', marginRight: 6 }} /><b>{m.user?.name || 'User'}:</b> {m.text} {canModerate && m.user?.id !== me?.id && <button onClick={() => blockUser(m.user.id)} style={{ width: 'auto', marginLeft: 8 }}>{t('block')}</button>}</p>)}</div>{stream?.status !== 'ended' ? <form onSubmit={sendMessage}><input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('messagePlaceholder')} /><button type="submit">{t('send')}</button></form> : <p>{t('chatHistoryOnly')}</p>}</section>)
}
