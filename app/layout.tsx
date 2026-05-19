// Path: app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import LayoutShell from '@/components/LayoutShell'

export const metadata: Metadata = {
  title: 'Phoenix Advanced Softwares Pvt. Ltd',
  description: 'Campaigns Manager Admin Panel',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 text-slate-800 antialiased">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  )
}