import { Bell, Globe, Lock, Palette, User } from 'lucide-react'
import { Card, PageHeader } from '@/components/admin/ui'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export default function Settings() {
  const [formState, setFormState] = useState({
    name: 'Key Institute',
    email: '@keyinstitute.edu.sv',
    cycle: '2026-01',
    timezone: 'GMT-6 (San Salvador)',
    lateEnrollment: false,
    validatePrerequisites: true,
    notifyEmail: true,
    autoOptimize: false,
  })
  const [isDirty, setIsDirty] = useState(false)
  const [activeTab, setActiveTab] = useState('Perfil')

  const handleFieldChange = (field: keyof typeof formState, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const handleSave = () => {
    console.log('Saving settings:', formState)
    setIsDirty(false)
    // TODO: Send data to backend
  }

  const handleCancel = () => {
    setFormState({
      name: 'Key Institute',
      email: '@keyinstitute.edu.sv',
      cycle: '2026-01',
      timezone: 'GMT-6 (San Salvador)',
      lateEnrollment: false,
      validatePrerequisites: true,
      notifyEmail: true,
      autoOptimize: false,
    })
    setIsDirty(false)
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title="Ajustes"
        description="Configuración general del sistema y preferencias"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <nav className="space-y-1">
          {[
            { icon: User, label: 'Perfil' },
            { icon: Bell, label: 'Notificaciones' },
            { icon: Lock, label: 'Seguridad' },
            { icon: Palette, label: 'Apariencia' },
            { icon: Globe, label: 'Idioma y región' },
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => setActiveTab(s.label)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === s.label
                  ? 'bg-status-warning/10 text-status-warning'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <s.icon className="h-4 w-4" />
              {s.label}
            </button>
          ))}
        </nav>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h3 className="mb-1 text-lg font-semibold text-foreground">Información del sistema</h3>
            <p className="mb-5 text-xs text-muted-foreground">
              Datos generales de la institución
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field 
                label="Nombre institucional" 
                value={formState.name}
                onChange={(v) => handleFieldChange('name', v)}
              />
              <Field 
                label="Dominio de correo"
                value={formState.email}
                onChange={(v) => handleFieldChange('email', v)}
              />
              <Field 
                label="Ciclo académico"
                value={formState.cycle}
                onChange={(v) => handleFieldChange('cycle', v)}
              />
              <Field 
                label="Zona horaria"
                value={formState.timezone}
                onChange={(v) => handleFieldChange('timezone', v)}
              />
            </div>
          </Card>

          <Card>
            <h3 className="mb-1 text-lg font-semibold text-foreground">Reglas de inscripción</h3>
            <p className="mb-5 text-xs text-muted-foreground">
              Parámetros que usa el motor de horarios
            </p>
            <div className="space-y-4">
              <Toggle 
                label="Permitir inscripción tardía" 
                description="Estudiantes pueden inscribir hasta 7 días después"
                checked={formState.lateEnrollment}
                onChange={(v) => handleFieldChange('lateEnrollment', v)}
              />
              <Toggle 
                label="Validar prerrequisitos automáticamente" 
                description="Bloquea inscripción si faltan requisitos"
                checked={formState.validatePrerequisites}
                onChange={(v) => handleFieldChange('validatePrerequisites', v)}
              />
              <Toggle 
                label="Notificar por correo al asignar horario" 
                description="Envía correo al estudiante y profesor"
                checked={formState.notifyEmail}
                onChange={(v) => handleFieldChange('notifyEmail', v)}
              />
              <Toggle 
                label="Optimización automática diaria" 
                description="Se ejecuta cada madrugada a las 03:00"
                checked={formState.autoOptimize}
                onChange={(v) => handleFieldChange('autoOptimize', v)}
              />
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <button 
              onClick={handleCancel}
              disabled={!isDirty}
              className="h-10 rounded-lg border border-border bg-card px-4 text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              disabled={!isDirty}
              className="h-10 rounded-lg bg-status-warning px-4 text-sm font-semibold text-white hover:bg-status-warning/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange?: (value: string) => void }) {
  const isReadOnly = !onChange
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={isReadOnly}
        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-status-warning/50 focus:outline-none focus:ring-2 focus:ring-status-warning/20"
      />
    </label>
  )
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked?: boolean
  onChange?: (value: boolean) => void
}) {
  const effectiveChecked = checked ?? false
  const isReadOnly = !onChange
  
  return (
    <label className={cn("flex items-start justify-between gap-4 rounded-lg border border-border bg-background/40 p-4", !isReadOnly && "cursor-pointer hover:border-status-warning/40")}>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="relative inline-flex h-5 w-9 items-center">
        <input 
          type="checkbox" 
          checked={effectiveChecked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={isReadOnly}
          className="peer sr-only" 
        />
        <div className="h-5 w-9 shrink-0 rounded-full bg-muted transition-colors peer-checked:bg-status-warning peer-disabled:opacity-50" />
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4 peer-disabled:opacity-50" />
      </div>
    </label>
  )
}
