import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Shelfdrop Portal',
  description: 'Brand portal for Shelfdrop distribution partners',
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
