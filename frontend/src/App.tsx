import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { CheckCircle2, Users, BookOpen, BarChart3 } from 'lucide-react'

function App() {
  const { user } = useUser()
  const [selectedRole, setSelectedRole] = useState<'student' | 'professor' | 'admin' | null>(null)

  return (
    <div className="min-h-screen bg-dark text-dark-primary">
      <SignedOut>
        <HomeScreen selectedRole={selectedRole} setSelectedRole={setSelectedRole} />
      </SignedOut>

      <SignedIn>
        <div className="flex items-center justify-between p-4 border-b border-dark-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-status-accent to-status-info flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">EKeyLibrium</h1>
              <p className="text-xs text-muted-foreground">Schedule Management</p>
            </div>
          </div>
          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              elements: {
                userButtonPopoverActionButton: "text-dark-primary",
                userButtonPopoverContainer: "bg-dark-secondary border border-dark-subtle"
              }
            }}
          />
        </div>

        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold mb-2">Bienvenido, {user?.firstName}! 👋</h2>
            <p className="text-muted-foreground mb-8">Tu portal de gestión de horarios y materias</p>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Placeholder para contenido del dashboard */}
              <div className="col-span-full text-center py-16 text-dark-muted">
                Dashboard en construcción...
              </div>
            </div>
          </div>
        </main>
      </SignedIn>
    </div>
  )
}

function HomeScreen({ 
  selectedRole, 
  setSelectedRole 
}: { 
  selectedRole: 'student' | 'professor' | 'admin' | null
  setSelectedRole: (role: 'student' | 'professor' | 'admin' | null) => void
}) {
  return (
    <div className="min-h-screen bg-dark flex flex-col">
      {/* Header */}
      <header className="border-b border-dark-subtle py-6 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-status-accent to-status-info flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-dark-primary">EKeyLibrium</h1>
              <p className="text-sm text-muted-foreground">Sistema Inteligente de Inscripción y Horarios</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          {!selectedRole ? (
            // Role Selection
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Student Card */}
              <RoleCard
                icon={<Users className="w-8 h-8" />}
                title="Estudiante"
                description="Inscribe tus materias, visualiza tu horario y gestiona tu carga académica"
                color="from-status-info to-blue-400"
                onClick={() => setSelectedRole('student')}
              />

              {/* Professor Card */}
              <RoleCard
                icon={<BookOpen className="w-8 h-8" />}
                title="Profesor"
                description="Configura tu horario, gestiona clases y visualiza distribución de estudiantes"
                color="from-status-success to-emerald-400"
                onClick={() => setSelectedRole('professor')}
              />

              {/* Admin Card */}
              <RoleCard
                icon={<BarChart3 className="w-8 h-8" />}
                title="Administrador"
                description="Controla recursos, optimiza horarios y visualiza analítica del sistema"
                color="from-status-warning to-amber-400"
                onClick={() => setSelectedRole('admin')}
              />
            </div>
          ) : (
            // Login Form
            <LoginForm role={selectedRole} onBack={() => setSelectedRole(null)} />
          )}

          {/* Features */}
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

      {/* Footer */}
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
      className="group relative overflow-hidden rounded-lg border border-dark-subtle bg-dark-secondary p-6 transition-all duration-300 hover:border-status-accent hover:bg-dark-secondary hover:shadow-dark-lg hover:shadow-status-accent/10"
    >
      {/* Gradient background on hover */}
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
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-6 text-muted-foreground hover:text-dark-primary transition-colors text-sm font-medium flex items-center gap-2"
      >
        ← Volver a roles
      </button>

      {/* Login Card */}
      <div className="rounded-xl border border-dark-subtle bg-dark-secondary p-8 shadow-dark-xl animate-fade-in">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className={`inline-block rounded-lg bg-gradient-to-br ${roleInfo.color} p-4 mb-4 text-white`}>
            <Icon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-dark-primary">{roleInfo.title}</h2>
          <p className="text-sm text-muted-foreground mt-2">Inicia sesión con tu cuenta @keyinstitute.edu.sv</p>
        </div>

        {/* Clerk Sign In */}
        <div className="mb-6">
          <SignInButton 
            mode="modal"
          >
            <Button
              size="lg"
              className="w-full bg-status-accent hover:bg-blue-600 text-white font-semibold transition-all duration-200"
            >
              Iniciar Sesión
            </Button>
          </SignInButton>
        </div>

        {/* Info Box */}
        <div className="rounded-lg bg-dark-input border border-dark-subtle p-4 text-xs text-muted-foreground space-y-2">
          <p>✓ Acceso seguro con verificación de dos factores</p>
          <p>✓ Solo usuarios con dominio @keyinstitute.edu.sv</p>
          <p>✓ Tus datos están protegidos y cifrados</p>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-6 text-center text-xs text-dark-muted">
        <p>Asegúrate de usar una conexión segura (HTTPS)</p>
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
    <div className="flex gap-4 p-4 rounded-lg border border-dark-subtle bg-dark-secondary/50 hover:border-status-accent/50 transition-colors duration-300">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <h4 className="font-bold text-dark-primary mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export default App