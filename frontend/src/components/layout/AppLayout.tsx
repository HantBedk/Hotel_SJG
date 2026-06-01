import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const PAGE_TITLES: Record<string, string> = {
  '/':             'Dashboard',
  '/rooms':        'Habitaciones',
  '/stays':        'Estadías',
  '/guests':       'Huéspedes',
  '/reservations': 'Reservaciones',
  '/reports':      'Reportes',
  '/settings':     'Configuración',
}

const DARK_MODE_KEY = 'hotel_dark_mode'

export default function AppLayout() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem(DARK_MODE_KEY) === 'true'
  )

  const title = PAGE_TITLES[location.pathname] ?? 'Hotel Manager'

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem(DARK_MODE_KEY, String(darkMode))
  }, [darkMode])

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar — desktop */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar collapsed={collapsed} />
      </div>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        <Header
          title={title}
          onToggleSidebar={() => setCollapsed((c) => !c)}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((d) => !d)}
        />

        <main
          className="flex-1 overflow-y-auto p-6"
          style={{ background: 'var(--bg-base)' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
