import { Construction } from 'lucide-react'
import { Card, PageHeader } from '@/components/admin/ui'

export default function Placeholder({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <Card className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <div className="rounded-full bg-status-warning/10 p-4 text-status-warning">
          <Construction className="h-8 w-8" />
        </div>
        <p className="text-base font-semibold text-foreground">Sección en construcción</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Esta página estará disponible próximamente. La UI está lista para conectarse al backend.
        </p>
      </Card>
    </div>
  )
}
