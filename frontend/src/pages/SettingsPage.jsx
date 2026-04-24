import { useSettings } from '../settings'

export default function SettingsPage() {
  const { theme, setTheme, language, setLanguage, t } = useSettings()

  return (
    <section className="settings-panel">
      <h1>{t('appSettings')}</h1>
      <label>{t('theme')}</label>
      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        <option value="light">{t('light')}</option>
        <option value="dark">{t('dark')}</option>
      </select>

      <label>{t('language')}</label>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="ru">{t('russian')}</option>
        <option value="en">{t('english')}</option>
      </select>
    </section>
  )
}
