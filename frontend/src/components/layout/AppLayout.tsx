import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import HotelSwitchOverlay from './HotelSwitchOverlay'
import NotificationModal from '@/components/notifications/NotificationModal'
import { useHotelStore } from '@/store/hotelStore'
import { cn } from '@/lib/cn'

const PAGE_TITLES: Record<string, string> = {
  '/':             'Dashboard',
  '/rooms':        'Habitaciones',
  '/stays':        'Estadías',
  '/guests':       'Huéspedes',
  '/companies':    'Empresas',
  '/reservations': 'Reservaciones',
  '/calendar':     'Calendario',
  '/inventory':    'Inventario',
  '/income':       'Ingresos',
  '/activity':     'Historial',
  '/settings':     'Configuración',
}

const DARK_MODE_KEY = 'hotel_dark_mode'

export default function AppLayout() {
  const location = useLocation()
  const currentHotelId = useHotelStore((s) => s.currentHotelId)
  const isSwitchingHotel = useHotelStore((s) => s.isSwitchingHotel)
  const hotels = useHotelStore((s) => s.hotels)
  const [collapsed, setCollapsed]     = useState(false)
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem(DARK_MODE_KEY) === 'true'
  )

  const title = PAGE_TITLES[location.pathname] ?? 'Hotel Manager'
  const switchingHotelName = hotels.find((h) => h.id === currentHotelId)?.name

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Close mobile sidebar on Escape
  useEffect(() => {
    if (!mobileOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [mobileOpen])

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
    localStorage.setItem(DARK_MODE_KEY, String(darkMode))
  }, [darkMode])

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar — desktop only */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar collapsed={collapsed} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar drawer */}
      <div
        className={[
          'fixed top-0 left-0 h-full z-50 lg:hidden transition-transform duration-300 flex flex-shrink-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <Sidebar collapsed={false} onClose={() => setMobileOpen(false)} />
      </div>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        <Header
          title={title}
          onToggleSidebar={() => {
            if (window.innerWidth >= 1024) {
              setCollapsed((c) => !c)
            } else {
              setMobileOpen((o) => !o)
            }
          }}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((d) => !d)}
        />

        <main
          className="relative flex-1 overflow-y-auto p-4 md:p-6"
          style={{ background: 'var(--bg-base)' }}
        >
          <HotelSwitchOverlay show={isSwitchingHotel} hotelName={switchingHotelName} />
          <div
            className={cn(
              'transition-opacity duration-300 ease-out',
              isSwitchingHotel ? 'opacity-40 pointer-events-none select-none' : 'opacity-100',
            )}
          >
            <Outlet key={currentHotelId ?? 'no-hotel'} />
          </div>
        </main>
      </div>

      <NotificationModal />
    </div>
  )
}
