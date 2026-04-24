import { useEffect, useState } from 'react'
import { api } from '../api'

export default function Chat({ streamId }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [lastId, setLastId] = useState(0)

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const incoming = await api(`/streams/${streamId}/messages?since_id=${lastId}`)
        if (incoming.length) {
          setMessages((prev) => [...prev, ...incoming])
          setLastId(incoming[incoming.length - 1].id)
        }
      } catch {
        // silent polling fail
      }
    }, 2000)

    return () => clearInterval(timer)
  }, [streamId, lastId])

  async function sendMessage(e) {
    e.preventDefault()
    if (!text.trim()) return
    const created = await api(`/streams/${streamId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
    setMessages((prev) => [...prev, created])
    setLastId(created.id)
    setText('')
  }

  return (
    <section className="chat">
      <h3>Чат</h3>
      <div className="chat-messages">
        {messages.map((m) => (
          <p key={m.id}><b>{m.user?.name || 'User'}:</b> {m.text}</p>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Сообщение..." />
        <button type="submit">Отправить</button>
      </form>
    </section>
  )
}
