import { Bell, Globe, Lock, Palette, User } from 'lucide-react'
import { Card, PageHeader } from '@/components/admin/ui'

export default function Settings() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Ajustes"
        description="Configuración general del sistema y preferencias"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <nav className="space-y-1">
          {[
            { icon: User, label: 'Perfil', active: true },
            { icon: Bell, label: 'Notificaciones' },
            { icon: Lock, label: 'Seguridad' },
            { icon: Palette, label: 'Apariencia' },
            { icon: Globe, label: 'Idioma y región' },
          ].map((s) => (
            <button
              key={s.label}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                s.active
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
              <Field label="Nombre institucional" value="Key Institute" />
              <Field label="Dominio de correo" value="@keyinstitute.edu.sv" />
              <Field label="Ciclo académico" value="2026-01" />
              <Field label="Zona horaria" value="GMT-6 (San Salvador)" />
            </div>
          </Card>

          <Card>
            <h3 className="mb-1 text-lg font-semibold text-foreground">Reglas de inscripción</h3>
            <p className="mb-5 text-xs text-muted-foreground">
              Parámetros que usa el motor de horarios
            </p>
            <div className="space-y-4">
              <Toggle label="Permitir inscripción tardía" description="Estudiantes pueden inscribir hasta 7 días después" />
              <Toggle label="Validar prerrequisitos automáticamente" description="Bloquea inscripción si faltan requisitos" defaultChecked />
              <Toggle label="Notificar por correo al asignar horario" description="Envía correo al estudiante y profesor" defaultChecked />
              <Toggle label="Optimización automática diaria" description="Se ejecuta cada madrugada a las 03:00" />
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <button className="h-10 rounded-lg border border-border bg-card px-4 text-sm hover:bg-muted">
              Cancelar
            </button>
            <button className="h-10 rounded-lg bg-status-warning px-4 text-sm font-semibold text-white hover:bg-status-warning/90">
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        defaultValue={value}
        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-status-warning/50 focus:outline-none focus:ring-2 focus:ring-status-warning/20"
      />
    </label>
  )
}

function Toggle({
  label,
  description,
  defaultChecked,
}: {
  label: string
  description: string
  defaultChecked?: boolean
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-border bg-background/40 p-4 hover:border-status-warning/40">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <input type="checkbox" defaultChecked={defaultChecked} className="peer sr-only" />
      <div className="relative h-5 w-9 shrink-0 rounded-full bg-muted transition-colors peer-checked:bg-status-warning">
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
      </div>
    </label>
  )
}
