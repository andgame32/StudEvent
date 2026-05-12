import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import CreateStreamPage from './pages/CreateStreamPage'
import EditStreamPage from './pages/EditStreamPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import MyStreamsPage from './pages/MyStreamsPage'
import NotFoundPage from './pages/NotFoundPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import SettingsPage from './pages/SettingsPage'
import StreamPage from './pages/StreamPage'
import StreamsListPage from './pages/StreamsListPage'
import AdminPage from './pages/AdminPage'
import { useSettings } from './settings'

function AppLayout({ children }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const { t } = useSettings()

  function closeMobileSidebar() {
    setIsMobileSidebarOpen(false)
  }

  return (
    <div className={`app-shell${isMobileSidebarOpen ? ' sidebar-open' : ''}`}>
      <button
        className="mobile-sidebar-toggle"
        type="button"
        aria-expanded={isMobileSidebarOpen}
        aria-controls="app-sidebar"
        onClick={() => setIsMobileSidebarOpen((isOpen) => !isOpen)}
      >
        ☰ {t('menu')}
      </button>
      <div className="mobile-sidebar-backdrop" onClick={closeMobileSidebar} />
      <Sidebar onNavigate={closeMobileSidebar} />
      <main className="content">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<AppLayout><HomePage /></AppLayout>} />
      <Route path="/profile" element={<AppLayout><ProfilePage /></AppLayout>} />
      <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
      <Route path="/admin" element={<AppLayout><AdminPage /></AppLayout>} />
      <Route path="/streams" element={<AppLayout><StreamsListPage /></AppLayout>} />
      <Route path="/my-streams" element={<AppLayout><MyStreamsPage /></AppLayout>} />
      <Route path="/streams/create" element={<AppLayout><CreateStreamPage /></AppLayout>} />
      <Route path="/streams/:id/edit" element={<AppLayout><EditStreamPage /></AppLayout>} />
      <Route path="/streams/:id" element={<AppLayout><StreamPage /></AppLayout>} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
