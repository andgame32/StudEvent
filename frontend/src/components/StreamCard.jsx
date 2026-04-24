import { Link } from 'react-router-dom'

export default function StreamCard({ stream }) {
  return (
    <Link className="stream-card" to={`/streams/${stream.id}`}>
      {stream.preview_url ? (
        <img className="stream-thumb-image" src={stream.preview_url} alt={stream.title} />
      ) : (
        <div className="stream-thumb" />
      )}
      <h3>{stream.title}</h3>
      <p>{stream.description || 'Без описания'}</p>
      <small>{new Date(stream.scheduled_at).toLocaleString()}</small>
    </Link>
  )
}
