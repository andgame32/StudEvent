import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const translations = {
  ru: {
    home: 'Главная',
    allStreams: 'Все стримы',
    myStreams: 'Мои стримы',
    createStream: 'Создать стрим',
    profile: 'Профиль',
    settings: 'Настройки',
    logout: 'Выйти',
    institution: 'Ваше учреждение',
    participant: 'Участник',
    liveNow: 'Текущие трансляции:',
    upcoming: 'Предстоящие трансляции:',
    nothingLive: 'Ничего не идет',
    nothingUpcoming: 'Ничего не предстоит',
    endStream: 'Завершить эфир',
    streamEnded: 'Эфир завершен',
    streamStartHint: 'Нажмите "Начать эфир", затем откройте эту же страницу в другом браузере как зритель.',
    streamWatchHint: 'Нажмите "Подключиться" для просмотра.',
    connect: 'Подключиться',
    startLive: 'Начать эфир',
    reconnect: 'Переподключить',
    appSettings: 'Настройки приложения',
    theme: 'Тема',
    language: 'Язык',
    light: 'Светлая',
    dark: 'Темная',
    russian: 'Русский',
    english: 'Английский',
  },
  en: {
    home: 'Home',
    allStreams: 'All streams',
    myStreams: 'My streams',
    createStream: 'Create stream',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Logout',
    institution: 'Your institution',
    participant: 'Participant',
    liveNow: 'Live now:',
    upcoming: 'Upcoming streams:',
    nothingLive: 'Nothing live now',
    nothingUpcoming: 'Nothing upcoming',
    endStream: 'End stream',
    streamEnded: 'Stream ended',
    streamStartHint: 'Click "Start live", then open the same stream page in another browser as viewer.',
    streamWatchHint: 'Click "Connect" to watch.',
    connect: 'Connect',
    startLive: 'Start live',
    reconnect: 'Reconnect',
    appSettings: 'Application settings',
    theme: 'Theme',
    language: 'Language',
    light: 'Light',
    dark: 'Dark',
    russian: 'Russian',
    english: 'English',
  },
}

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'ru')

  useEffect(() => {
    localStorage.setItem('theme', theme)
    document.body.classList.toggle('theme-dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  const value = useMemo(() => ({
    theme,
    setTheme,
    language,
    setLanguage,
    t: (key) => translations[language][key] || key,
  }), [theme, language])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  return useContext(SettingsContext)
}
