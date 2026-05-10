import { useEffect, useState } from 'react'
import { api, getCurrentUser, setCurrentUser } from '../api'
import { useSettings } from '../settings'

export default function ProfilePage() {
  const [user, setUser] = useState(getCurrentUser()); const [avatar, setAvatar] = useState(null); const [role, setRole] = useState('student'); const { t } = useSettings()
  useEffect(() => { api('/me').then((d)=>{ setUser(d); setRole(d.role || 'student'); setCurrentUser(d) }).catch(() => setUser(getCurrentUser())) }, [])
  async function uploadAvatar(e){ e.preventDefault(); const fd=new FormData(); if(avatar) fd.append('avatar',avatar); fd.append('role', role); const updated=await api('/me',{method:'PUT',body:fd}); setUser(updated); setCurrentUser(updated) }
  if (!user) return <p>{t('loginToProfile')}</p>
  return <div className="page-card"><h1>{t('profile')}</h1><p>{t('name')}: {user.name}</p><p>Email: {user.email}</p><form onSubmit={uploadAvatar}><input type="file" accept="image/*" onChange={(e)=>setAvatar(e.target.files?.[0] || null)} /><label>{t('rolePreview')}</label><select value={role} onChange={(e)=>setRole(e.target.value)}><option value="student">{t('student')}</option><option value="teacher">{t('teacher')}</option><option value="moderator">{t('moderator')} (preview)</option><option value="admin">{t('admin')} (preview)</option></select><button type="submit">{t('save')}</button></form></div>
}
