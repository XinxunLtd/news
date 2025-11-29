'use client'

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
      <div className="min-h-screen flex flex-col">
        <PublisherHeader />
        {children}
        <PublisherFooter />
      </div>
    </SidebarProvider>
  )
}

