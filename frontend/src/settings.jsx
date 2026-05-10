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
    login: 'Войти',
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
    loading: 'Загрузка...',
    streamEndedBanner: 'Этот стрим завершен',
    status: 'Статус',
    edit: 'Редактировать',
    chat: 'Чат',
    send: 'Отправить',
    messagePlaceholder: 'Сообщение...',
    chatHistoryOnly: 'Доступна только история чата.',
    block: 'Блок',
    blockMinutesPrompt: 'На сколько минут заблокировать пользователя?',
    friendSearch: 'Ник или email друга',
    addFriend: 'Добавить в друзья',
    admin: 'Админ',
    loginToProfile: 'Войдите, чтобы увидеть профиль.',
    name: 'Имя',
    rolePreview: 'Роль (модератор/админ только превью)',
    student: 'Студент',
    teacher: 'Преподаватель',
    moderator: 'Модератор',
    save: 'Сохранить',
    streamStartError: 'Ошибка запуска трансляции'
  },
  en: {
    home: 'Home',
    allStreams: 'All streams',
    myStreams: 'My streams',
    createStream: 'Create stream',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Logout',
    login: 'Login',
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
    loading: 'loading',
    streamEndedBanner: 'streamEndedBanner',
    status: 'status',
    edit: 'edit',
    chat: 'chat',
    send: 'send',
    messagePlaceholder: 'messagePlaceholder',
    chatHistoryOnly: 'chatHistoryOnly',
    block: 'block',
    blockMinutesPrompt: 'blockMinutesPrompt',
    friendSearch: 'friendSearch',
    addFriend: 'addFriend',
    admin: 'admin',
    loginToProfile: 'loginToProfile',
    name: 'name',
    rolePreview: 'rolePreview',
    student: 'student',
    teacher: 'teacher',
    moderator: 'moderator',
    save: 'save',
    streamStartError: 'streamStartError'
  },
}

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'ru')

  useEffect(() => {
    localStorage.setItem('theme', theme)
    document.body.classList.toggle('theme-dark', theme === 'dark')
    document.body.classList.toggle('theme-light', theme === 'light')
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


// check
