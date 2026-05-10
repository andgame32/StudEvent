import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, clearCurrentUser, clearToken, getCurrentUser, setCurrentUser, toAbsoluteUrl } from '../api'
import { useSettings } from '../settings'

export default function Sidebar() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState([])
  const [user, setUser] = useState(getCurrentUser())
  const [friendQuery, setFriendQuery] = useState('')
  const { t } = useSettings()

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const [related, me] = await Promise.all([api('/related-accounts'), api('/me')])
        if (!mounted) return
        setAccounts(related)
        setUser(me)
        setCurrentUser(me)
      } catch {
        if (!mounted) return
        setAccounts([])
        setUser(getCurrentUser())
      }
    }

    load()
    const timer = setInterval(load, 10000)

    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [])

  async function handleLogout() {
    try {
      await api('/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    clearToken()
    clearCurrentUser()
    navigate('/login')
  }

  async function addFriend(e) {
    e.preventDefault()
    if (!friendQuery.trim()) return
    await api('/friends', { method: 'POST', body: JSON.stringify({ query: friendQuery.trim() }) })
    setFriendQuery('')
  }

  const sorted = [...accounts].sort((a, b) => Number(b.role === 'teacher') - Number(a.role === 'teacher'))

  return (
    <aside className="sidebar">
      <div className="logo"><span>Stud</span>Event</div>

      {user && (
        <div className="related-account sidebar-profile">
          <img className="avatar-dot" src={user.avatar_url ? toAbsoluteUrl(user.avatar_url) : 'https://placehold.co/26x26'} alt="avatar" />
          <div>
            <strong className={user.role === 'teacher' ? 'teacher-name' : ''}>{user.name}</strong>
            <small>{user.email}</small>
          </div>
        </div>
      )}

      <form onSubmit={addFriend} className="sidebar-friend-form">
        <input placeholder={t('friendSearch')} value={friendQuery} onChange={(e) => setFriendQuery(e.target.value)} />
        <button type="submit">{t('addFriend')}</button>
      </form>

      <div>
        <p className="sidebar-title">{t('institution')}</p>
        <div className="related-accounts">
          {sorted.slice(0, 3).map((account) => (
            <div className="related-account" key={account.id}>
              <img className="avatar-dot" src={account.avatar_url ? toAbsoluteUrl(account.avatar_url) : 'https://placehold.co/26x26'} alt="avatar" />
              <div>
                <strong className={account.role === 'teacher' ? 'teacher-name' : ''}>{account.name}</strong>
                <small>{account.role || t('participant')}</small>
              </div>
            </div>
          ))}
        </div>
      </div>

      <nav className="sidebar-nav">
        <Link to="/">{t('home')}</Link>
        <Link to="/streams">{t('allStreams')}</Link>
        <Link to="/my-streams">{t('myStreams')}</Link>
        <Link to="/streams/create">{t('createStream')}</Link>
        <Link to="/profile">{t('profile')}</Link>
        <Link to="/settings">{t('settings')}</Link>
        {user?.is_admin && <Link to="/admin">{t('admin')}</Link>}
      </nav>

      <button className="logout-btn" onClick={handleLogout}>{t('logout')}</button>
    </aside>
  )
}
