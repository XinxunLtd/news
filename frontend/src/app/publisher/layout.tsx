'use client'

import PublisherSidebar from '@/components/PublisherSidebar'
import PublisherHeader from '@/components/PublisherHeader'
import PublisherFooter from '@/components/PublisherFooter'
import { SidebarProvider } from '@/contexts/SidebarContext'

export default function PublisherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex overflow-x-hidden">
        <PublisherSidebar />
        <div className="flex-1 flex flex-col md:ml-64 overflow-x-hidden">
          <PublisherHeader />
          <main className="flex-1 overflow-auto overflow-x-hidden">
            {children}
          </main>
          <PublisherFooter />
        </div>
      </div>
    </SidebarProvider>
  )
}

