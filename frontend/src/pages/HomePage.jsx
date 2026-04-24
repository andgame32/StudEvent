import { useEffect, useState } from 'react'
import { api } from '../api'
import StreamCard from '../components/StreamCard'
import { useSettings } from '../settings'

export default function HomePage() {
  const [live, setLive] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const { t } = useSettings()

  useEffect(() => {
    api('/streams/now').then(setLive).catch(() => setLive([]))
    api('/streams/upcoming').then(setUpcoming).catch(() => setUpcoming([]))
  }, [])

  return (
    <div>
      <h1>{t('liveNow')}</h1>
      {live.length ? <div className="grid one">{live.map((s) => <StreamCard key={s.id} stream={s} />)}</div> : <p>{t('nothingLive')}</p>}
      <h1>{t('upcoming')}</h1>
      {upcoming.length ? <div className="grid">{upcoming.map((s) => <StreamCard key={s.id} stream={s} />)}</div> : <p>{t('nothingUpcoming')}</p>}
    </div>
  )
}
