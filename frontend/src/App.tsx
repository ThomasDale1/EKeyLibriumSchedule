import { SignedIn, SignedOut, SignInButton, useAuth } from '@clerk/clerk-react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { CheckCircle2, Users, BookOpen, BarChart3 } from 'lucide-react'

import { AdminLayout } from '@/components/admin/AdminLayout'
import Dashboard from '@/pages/admin/Dashboard'
import Materias from '@/pages/admin/Materias'
import Profesores from '@/pages/admin/Profesores'
import Estudiantes from '@/pages/admin/Estudiantes'
import Horarios from '@/pages/admin/Horarios'
import Salones from '@/pages/admin/Salones'
import Analytics from '@/pages/admin/Analytics'
import Settings from '@/pages/admin/Settings'
import Placeholder from '@/pages/admin/Placeholder'
import { useMe } from '@/hooks/useApiQueries'

// Route guard: requiere sesión + carga el usuario desde backend (auto-aprovisiona si no existe)
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth()
  const me = useMe()

  if (!isLoaded) {
    return <LoadingScreen label="Verificando acceso..." />
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />
  }

  if (me.isLoading) {
    return <LoadingScreen label="Cargando tu perfil..." />
  }

  if (me.isError) {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
    const displayUrl = import.meta.env.MODE === 'production' ? 'tu servidor backend' : backendUrl
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-center p-8">
        <div>
          <p className="text-lg text-red-400 mb-2">No se pudo conectar con el servidor</p>
          <p className="text-sm text-slate-400">
            Asegúrate de que {displayUrl} esté disponible y funcionando correctamente
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-900">
      <div className="text-center">
        <div className="mb-4 inline-block">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-amber-500"></div>
        </div>
        <p className="text-slate-400">{label}</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <SignedOut>
              <HomeScreen />
            </SignedOut>
            <SignedIn>
              <Navigate to="/admin" replace />
            </SignedIn>
          </>
        }
      />
      <Route
        path="/admin/*"
        element={
          <PrivateRoute>
            <AdminRoutes />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="analytics" element={<Analytics />} />
        <Route
          path="reports"
          element={<Placeholder title="Reportes" description="Reportes exportables del sistema" />}
        />
        <Route path="materias" element={<Materias />} />
        <Route path="profesores" element={<Profesores />} />
        <Route path="estudiantes" element={<Estudiantes />} />
        <Route path="horarios" element={<Horarios />} />
        <Route path="salones" element={<Salones />} />
        <Route
          path="inscripciones"
          element={<Placeholder title="Inscripciones" description="Cola y aprobación de inscripciones" />}
        />
        <Route
          path="usuarios"
          element={<Placeholder title="Usuarios" description="Gestión de roles y permisos del sistema" />}
        />
        <Route path="ajustes" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

function HomeScreen() {
  const [selectedRole, setSelectedRole] = useState<'student' | 'professor' | 'admin' | null>(null)

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <header className="border-b border-dark-subtle py-6 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-status-warning to-amber-500 flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-dark-primary">EKeyLibrium</h1>
              <p className="text-sm text-muted-foreground">Sistema Inteligente de Inscripción y Horarios</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          {!selectedRole ? (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <RoleCard
                icon={<Users className="w-8 h-8" />}
                title="Estudiante"
                description="Inscribe tus materias, visualiza tu horario y gestiona tu carga académica"
                color="from-status-info to-blue-400"
                onClick={() => setSelectedRole('student')}
              />
              <RoleCard
                icon={<BookOpen className="w-8 h-8" />}
                title="Profesor"
                description="Configura tu horario, gestiona clases y visualiza distribución de estudiantes"
                color="from-status-success to-emerald-400"
                onClick={() => setSelectedRole('professor')}
              />
              <RoleCard
                icon={<BarChart3 className="w-8 h-8" />}
                title="Administrador"
                description="Controla recursos, optimiza horarios y visualiza analítica del sistema"
                color="from-status-warning to-amber-400"
                onClick={() => setSelectedRole('admin')}
              />
            </div>
          ) : (
            <LoginForm role={selectedRole} onBack={() => setSelectedRole(null)} />
          )}

          {!selectedRole && (
            <div className="mt-16 grid md:grid-cols-2 gap-8">
              <Feature
                icon={<CheckCircle2 className="w-6 h-6 text-status-success" />}
                title="Cero Conflictos de Horario"
                description="Nuestro motor de optimización garantiza que no haya choques entre tus clases"
              />
              <Feature
                icon={<CheckCircle2 className="w-6 h-6 text-status-success" />}
                title="Horarios Optimizados"
                description="Minimiza tus huecos y tiempo en campus con algoritmos inteligentes"
              />
              <Feature
                icon={<CheckCircle2 className="w-6 h-6 text-status-success" />}
                title="Gestión de Recursos"
                description="Distribución eficiente de aulas, profesores y espacios de parqueo"
              />
              <Feature
                icon={<CheckCircle2 className="w-6 h-6 text-status-success" />}
                title="Analítica Avanzada"
                description="Dashboards detallados para tomar decisiones basadas en datos"
              />
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-dark-subtle py-6 px-4 text-center text-sm text-muted-foreground">
        <p>EKeyLibrium © 2026 • Key Institute • Todos los derechos reservados</p>
        <p className="mt-2">Dominio restringido: @keyinstitute.edu.sv</p>
      </footer>
    </div>
  )
}

interface RoleCardProps {
  icon: React.ReactNode
  title: string
  description: string
  color: string
  onClick: () => void
}

function RoleCard({ icon, title, description, color, onClick }: RoleCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-lg border border-dark-subtle bg-dark-secondary p-6 transition-all duration-300 hover:border-status-warning hover:bg-dark-secondary hover:shadow-dark-lg hover:shadow-status-warning/10"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 transition-opacity duration-300 group-hover:opacity-5`} />
      <div className="relative z-10">
        <div className={`inline-block rounded-lg bg-gradient-to-br ${color} p-3 mb-4 text-white`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-dark-primary mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </button>
  )
}

interface LoginFormProps {
  role: 'student' | 'professor' | 'admin'
  onBack: () => void
}

function LoginForm({ role, onBack }: LoginFormProps) {
  const getRoleInfo = () => {
    switch (role) {
      case 'student':
        return { title: 'Acceso de Estudiante', icon: Users, color: 'from-status-info to-blue-400' }
      case 'professor':
        return { title: 'Acceso de Profesor', icon: BookOpen, color: 'from-status-success to-emerald-400' }
      case 'admin':
        return { title: 'Acceso de Administrador', icon: BarChart3, color: 'from-status-warning to-amber-400' }
    }
  }

  const roleInfo = getRoleInfo()
  const Icon = roleInfo.icon

  return (
    <div className="max-w-md mx-auto">
      <button
        onClick={onBack}
        className="mb-6 text-muted-foreground hover:text-dark-primary transition-colors text-sm font-medium flex items-center gap-2"
      >
        ← Volver a roles
      </button>

      <div className="rounded-xl border border-dark-subtle bg-dark-secondary p-8 shadow-dark-xl animate-fade-in">
        <div className="mb-8 text-center">
          <div className={`inline-block rounded-lg bg-gradient-to-br ${roleInfo.color} p-4 mb-4 text-white`}>
            <Icon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-dark-primary">{roleInfo.title}</h2>
          <p className="text-sm text-muted-foreground mt-2">Inicia sesión con tu cuenta @keyinstitute.edu.sv</p>
        </div>

        <div className="mb-6">
          <SignInButton mode="modal" forceRedirectUrl="/admin">
            <Button
              size="lg"
              className="w-full bg-status-warning hover:bg-status-warning/90 text-white font-semibold transition-all duration-200"
            >
              Iniciar Sesión
            </Button>
          </SignInButton>
        </div>

        <div className="rounded-lg bg-dark-input border border-dark-subtle p-4 text-xs text-muted-foreground space-y-2">
          <p>✓ Acceso seguro con verificación de dos factores</p>
          <p>✓ Solo usuarios con dominio @keyinstitute.edu.sv</p>
          <p>✓ Tus datos están protegidos y cifrados</p>
        </div>
      </div>
    </div>
  )
}

interface FeatureProps {
  icon: React.ReactNode
  title: string
  description: string
}

function Feature({ icon, title, description }: FeatureProps) {
  return (
    <div className="flex gap-4 p-4 rounded-lg border border-dark-subtle bg-dark-secondary/50 hover:border-status-warning/50 transition-colors duration-300">
      <div className="shrink-0">{icon}</div>
      <div>
        <h4 className="font-bold text-dark-primary mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export default App
