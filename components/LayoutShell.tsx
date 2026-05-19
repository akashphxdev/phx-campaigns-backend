// Path: components/LayoutShell.tsx
'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Topbar  from '@/components/Topbar'

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const pathname    = usePathname()
  const hideSidebar = pathname === '/login'

  if (hideSidebar) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-100">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 ml-60">
        <Topbar />
        <main className="flex-1 p-6 pt-20">
          {children}
        </main>
      </div>
    </div>
  )
}