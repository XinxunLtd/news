'use client'

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
      <div className="min-h-screen flex flex-col">
        <AdminHeader />
        {children}
        <AdminFooter />
      </div>
    </SidebarProvider>
  )
}

