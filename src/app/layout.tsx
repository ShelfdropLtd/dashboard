import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Shelfdrop Brand Portal',
  description: 'Manage your brand partnership with Shelfdrop',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
