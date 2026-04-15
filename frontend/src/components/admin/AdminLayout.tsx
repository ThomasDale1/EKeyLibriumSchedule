import { Outlet } from 'react-router-dom'
import { Sidebar, Topbar } from './Sidebar'

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="pl-64">
        <Topbar />
        <main className="p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
