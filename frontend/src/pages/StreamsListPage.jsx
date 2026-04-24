import { useEffect, useState } from 'react'
import StreamCard from '../components/StreamCard'
import { api } from '../api'

export default function StreamsListPage() {
  const [streams, setStreams] = useState([])
  useEffect(() => {
    api('/streams').then(setStreams).catch(() => setStreams([]))
  }, [])

  return (
    <div>
      <h1>Все стримы</h1>
      <div className="grid">{streams.map((s) => <StreamCard key={s.id} stream={s} />)}</div>
    </div>
  )
}
