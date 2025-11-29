'use client'

import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'
import AdminFooter from '@/components/AdminFooter'
import { SidebarProvider } from '@/contexts/SidebarContext'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex overflow-x-hidden">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-x-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-auto overflow-x-hidden pt-4">
            {children}
          </main>
          <AdminFooter />
        </div>
      </div>
    </SidebarProvider>
  )
}

