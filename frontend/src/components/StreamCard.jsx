import { Link } from 'react-router-dom'
import { getMediaUrl } from '../api'

export default function StreamCard({ stream }) {
  return (
    <Link className="stream-card" to={`/streams/${stream.id}`}>
      <img className="stream-thumb-image" src={getMediaUrl(stream.preview_url, '/images/default-preview.svg')} alt={stream.title} />
      <h3>{stream.title}</h3>
      <p>{stream.description || 'Без описания'}</p>
      <small>{new Date(stream.scheduled_at).toLocaleString()}</small>
    </Link>
  )
}
