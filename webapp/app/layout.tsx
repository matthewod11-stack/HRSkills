import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HR Command Center',
  description: 'Claude-powered HR automation platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  )
}
