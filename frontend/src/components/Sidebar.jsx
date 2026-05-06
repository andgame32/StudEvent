import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, clearCurrentUser, clearToken, getCurrentUser, setCurrentUser } from '../api'
import { useSettings } from '../settings'

export default function Sidebar() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState([])
  const [user, setUser] = useState(getCurrentUser())
  const { t } = useSettings()

  useEffect(() => {
    api('/related-accounts').then(setAccounts).catch(() => setAccounts([]))
    api('/me')
      .then((data) => {
        setUser(data)
        setCurrentUser(data)
      })
      .catch(() => setUser(getCurrentUser()))
  }, [])

  async function handleLogout() {
    try {
      await api('/logout', { method: 'POST' })
    } catch {
      // ignore API logout error and clear local token anyway
    }
    clearToken()
    clearCurrentUser()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="logo"><span>Stud</span>Event</div>
      {user && (
        <div className="related-account sidebar-profile">
          <div className="avatar-dot" />
          <div>
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
        </div>
      )}
      {accounts.length > 0 && (
        <div>
          <p className="sidebar-title">{t('institution')}</p>
          <div className="related-accounts">
            {accounts.slice(0, 3).map((account) => (
              <div className="related-account" key={account.id}>
                <div className="avatar-dot" />
                <div>
                  <strong>{account.name}</strong>
                  <small>{account.role || t('participant')}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <nav className="sidebar-nav">
        <Link to="/">{t('home')}</Link>
        <Link to="/streams">{t('allStreams')}</Link>
        <Link to="/my-streams">{t('myStreams')}</Link>
        <Link to="/streams/create">{t('createStream')}</Link>
        <Link to="/profile">{t('profile')}</Link>
        <Link to="/settings">{t('settings')}</Link>
        {user?.is_admin && <Link to="/admin">Админ</Link>}
      </nav>
      <button className="logout-btn" onClick={handleLogout}>{t('logout')}</button>
    </aside>
  )
}
