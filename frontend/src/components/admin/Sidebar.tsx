import { NavLink } from 'react-router-dom'
import { useEffect } from 'react'
import {
  LayoutDashboard,
  BarChart3,
  LineChart,
  BookOpen,
  GraduationCap,
  Users,
  CalendarDays,
  DoorOpen,
  ClipboardList,
  Shield,
  Settings,
  Bell,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useMe, usePromoteToAdmin, Estudiantes, Inscripciones } from '@/hooks/useApiQueries'

type NavItem = {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

type NavSection = {
  title: string
  items: NavItem[]
}

export function Sidebar() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const { data: me } = useMe()
  const promote = usePromoteToAdmin()
  const { data: estudiantesList = [] } = Estudiantes.useList()
  const { data: inscripcionesList = [] } = Inscripciones.useList()

  const sections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/analytics', label: 'Analíticas', icon: BarChart3 },
      { to: '/admin/reports', label: 'Reportes', icon: LineChart },
    ],
  },
    {
      title: 'Académico',
      items: [
        { to: '/admin/materias', label: 'Materias', icon: BookOpen },
        { to: '/admin/profesores', label: 'Profesores', icon: GraduationCap },
        { to: '/admin/estudiantes', label: 'Estudiantes', icon: Users, badge: String(estudiantesList.length) },
        { to: '/admin/horarios', label: 'Horarios', icon: CalendarDays },
      ],
    },
    {
      title: 'Recursos',
      items: [
        { to: '/admin/salones', label: 'Salones', icon: DoorOpen },
        { to: '/admin/inscripciones', label: 'Inscripciones', icon: ClipboardList, badge: String(inscripcionesList.length) },
      ],
    },
  {
    title: 'Sistema',
    items: [
      { to: '/admin/usuarios', label: 'Usuarios', icon: Shield },
      { to: '/admin/ajustes', label: 'Ajustes', icon: Settings },
    ],
  },
]

  const rolLabel: Record<string, string> = {
    ADMIN: 'Administrador',
    PROFESOR: 'Profesor',
    ESTUDIANTE: 'Estudiante',
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      alert('Error al cerrar sesión. Por favor, intenta de nuevo.')
    }
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-status-warning to-amber-500">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-wide text-foreground">EKeyLibrium</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Admin Panel
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            <div className="mb-2 flex items-center justify-between px-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {section.title}
              </p>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/admin'}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-status-warning/10 text-status-warning'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute inset-y-1 left-0 w-0.5 rounded-r bg-status-warning" />
                        )}
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                              isActive
                                ? 'bg-status-warning/20 text-status-warning'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-status-warning to-amber-500 text-sm font-bold text-white">
            {user?.firstName?.[0] ?? 'A'}
            {user?.lastName?.[0] ?? 'S'}
          </div>
          <div className="flex-1 leading-tight">
            <p className="text-sm font-semibold text-foreground">
              {me?.nombre ?? user?.firstName ?? 'Admin'}{' '}
              {(me?.apellido?.[0] ?? user?.lastName?.[0] ?? '') &&
                `${me?.apellido?.[0] ?? user?.lastName?.[0]}.`}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {me ? rolLabel[me.rol] ?? me.rol : 'Cargando...'}
            </p>
            {me && me.rol !== 'ADMIN' && import.meta.env.MODE === 'development' && (
              <button
                onClick={() => promote.mutate()}
                disabled={promote.isPending}
                className="mt-1 text-[10px] text-status-warning hover:underline"
              >
                {promote.isPending ? 'Promoviendo...' : 'Convertir en admin (dev)'}
              </button>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  )
}

export function Topbar() {
  const handleNewSchedule = () => {
    alert('Formulario de nuevo horario - por implementar')
  }

  const handleOpenCommandPalette = () => {
    alert('Paleta de comandos - por implementar')
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        handleOpenCommandPalette()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur">
      <div className="relative flex-1 max-w-xl">
        <input
          id="topbar-search"
          type="text"
          placeholder="Buscar cualquier cosa..."
          aria-label="Buscar en el sistema"
          className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-16 text-sm text-foreground placeholder:text-muted-foreground focus:border-status-warning/50 focus:outline-none focus:ring-2 focus:ring-status-warning/20"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <kbd 
          role="button" 
          tabIndex={0}
          onClick={handleOpenCommandPalette}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleOpenCommandPalette()
            }
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors"
          aria-label="Abrir paleta de comandos (⌘K o Ctrl+K)"
        >
          ⌘K
        </kbd>
      </div>

      <button 
        onClick={handleNewSchedule}
        className="hidden sm:flex h-10 items-center gap-2 rounded-lg bg-status-warning px-4 text-sm font-semibold text-white hover:bg-status-warning/90 transition-colors"
        title="Crear nuevo horario"
      >
        <span className="text-lg leading-none">+</span> Nuevo Horario
      </button>

      <button 
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
        aria-label="Notificaciones"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
      </button>
    </header>
  )
}
