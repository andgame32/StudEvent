import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StreamCard from '../components/StreamCard'
import { api } from '../api'

export default function MyStreamsPage() {
  const [streams, setStreams] = useState([])
  useEffect(() => {
    api('/my-streams').then(setStreams).catch(() => setStreams([]))
  }, [])

  return (
    <div>
      <h1>Мои стримы</h1>
      <div className="grid">{streams.map((s) => <StreamCard key={s.id} stream={s} />)}</div>
      <p><Link to="/streams/create">+ Создать новый стрим</Link></p>
    </div>
  )
}
