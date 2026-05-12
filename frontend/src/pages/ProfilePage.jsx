import { useEffect, useState } from 'react'
import { api, getCurrentUser, setCurrentUser } from '../api'
import { useSettings } from '../settings'

export default function ProfilePage() {
  const [user, setUser] = useState(getCurrentUser())
  const [avatar, setAvatar] = useState(null)
  const [institution, setInstitution] = useState('ИАТ')
  const { t } = useSettings()

  useEffect(() => {
    api('/me').then((d) => {
      setUser(d)
      setInstitution(d.institution || 'ИАТ')
      setCurrentUser(d)
    }).catch(() => setUser(getCurrentUser()))
  }, [])

  async function uploadAvatar(e) {
    e.preventDefault()
    const fd = new FormData()
    if (avatar) fd.append('avatar', avatar)
    fd.append('institution', institution)
    const updated = await api('/me', { method: 'PUT', body: fd })
    setUser(updated)
    setCurrentUser(updated)
  }

  if (!user) return <p>{t('loginToProfile')}</p>

  return (
    <div className="page-card">
      <h1>{t('profile')}</h1>
      <p>{t('name')}: {user.name}</p>
      <p>Email: {user.email}</p>
      <p>Роль: {user.role || 'student'}</p>
      <form onSubmit={uploadAvatar}>
        <input type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files?.[0] || null)} />
        <label>Учреждение</label>
        <select value={institution} onChange={(e) => setInstitution(e.target.value)}>
          <option value="ИАТ">ИАТ</option>
          <option value="ИРГУПС">ИРГУПС</option>
          <option value="ПОЛИТЕХ">ПОЛИТЕХ</option>
        </select>
        <button type="submit">{t('save')}</button>
      </form>
    </div>
  )
}
