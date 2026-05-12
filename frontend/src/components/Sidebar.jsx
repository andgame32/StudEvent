import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, clearCurrentUser, clearToken, getCurrentUser, getMediaUrl, setCurrentUser } from '../api'
import { useSettings } from '../settings'

export default function Sidebar() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState([])
  const [user, setUser] = useState(getCurrentUser())
  const { t, theme, setTheme } = useSettings()

  useEffect(() => {
    if (user) {
      api('/institution-users').then(setAccounts).catch(() => setAccounts([]))
      api('/me').then((d) => { setUser(d); setCurrentUser(d) }).catch(() => setUser(getCurrentUser()))
    }
  }, [user])

  async function handleLogout() {
    try { await api('/logout', { method: 'POST' }) } catch { /* local logout should continue */ }
    clearToken()
    clearCurrentUser()
    navigate('/login')
  }

  function handleLogin() {
    navigate('/login')
  }

  function toggleTheme() {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const sorted = [...accounts].sort((a, b) => (b.role === 'teacher') - (a.role === 'teacher'))
  
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo"><span>Stud</span>Event</div>
        <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
      
      {user && (
        <div className="sidebar-profile">
          <img className="avatar-dot" src={getMediaUrl(user.avatar_url, '/images/default-avatar.svg')} alt="avatar" />
          <div className="profile-info">
            <strong className={user.role === 'teacher' ? 'teacher-name' : ''}>
              {user.name}
              {user.role === 'teacher' && <span className="teacher-badge">[ПРЕПОДАВАТЕЛЬ]</span>}
            </strong>
          </div>
        </div>
      )}
      
      {user?.institution && (
        <p className="sidebar-institution">{user.institution}</p>
      )}

      {user && (
        <>
          <p className="sidebar-title">{t('institution')}</p>
          <div className="related-accounts">
            {sorted.slice(0, 3).map((account) => (
              <div className="related-account" key={account.id}>
                <img className="avatar-dot" src={getMediaUrl(account.avatar_url, '/images/default-avatar.svg')} alt={account.name} />
                <div>
                  <strong className={account.role === 'teacher' ? 'teacher-name' : ''}>
                    {account.name}
                    {account.role === 'teacher' && <span className="teacher-badge">[ПРЕПОДАВАТЕЛЬ]</span>}
                  </strong>
                  <small>{account.role || t('participant')}</small>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <nav className="sidebar-nav">
        <Link to="/">{t('home')}</Link>
        <Link to="/streams">{t('allStreams')}</Link>
        {user && <Link to="/my-streams">{t('myStreams')}</Link>}
        {user && <Link className="sidebar-link-wide" to="/streams/create">{t('createStream')}</Link>}
        {user && <Link to="/profile">{t('profile')}</Link>}
        {user && <Link to="/settings">{t('settings')}</Link>}
        {user?.is_admin && <Link to="/admin">{t('admin')}</Link>}
      </nav>

      <button className="logout-btn" onClick={user ? handleLogout : handleLogin}>
        {user ? t('logout') : t('login')}
      </button>
    </aside>
  )
}
