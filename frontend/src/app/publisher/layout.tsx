'use client'

import { usePathname } from 'next/navigation'
import PublisherSidebar from '@/components/PublisherSidebar'
import PublisherHeader from '@/components/PublisherHeader'
import PublisherFooter from '@/components/PublisherFooter'
import { SidebarProvider } from '@/contexts/SidebarContext'

export default function PublisherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/publisher/login'

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex overflow-x-hidden">
        <PublisherSidebar />
        <div className="flex-1 flex flex-col overflow-x-hidden">
          <PublisherHeader />
          <main className="flex-1 overflow-auto overflow-x-hidden pt-4">
            {children}
          </main>
          <PublisherFooter />
        </div>
      </div>
    </SidebarProvider>
  )
}

