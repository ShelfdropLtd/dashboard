'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Package,
  FileText,
  LogOut,
  Building2,
  Users,
  Settings,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'

interface SidebarProps {
  userRole: 'brand' | 'admin'
  brandName?: string | null
}

export default function Sidebar({ userRole, brandName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const brandLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/orders', label: 'Orders', icon: Package },
    { href: '/invoices', label: 'Invoices', icon: FileText },
  ]

  const adminLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/brands', label: 'Brands', icon: Building2 },
    { href: '/admin/orders', label: 'Orders', icon: Package },
    { href: '/admin/invoices', label: 'Invoices', icon: FileText },
    { href: '/admin/users', label: 'Users', icon: Users },
  ]

  const links = userRole === 'admin' ? adminLinks : brandLinks

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/admin') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200">
        <div className="h-8 w-8 bg-brand-dark rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        <span className="ml-3 font-semibold text-gray-900">Shelfdrop</span>
      </div>

      {/* Brand name for brand users */}
      {userRole === 'brand' && brandName && (
        <div className="px-4 py-3 border-b border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Brand</p>
          <p className="text-sm font-medium text-gray-900 truncate">{brandName}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon
          const active = isActive(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`
                flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                ${active
                  ? 'bg-brand-accent text-white'
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              <Icon className="h-5 w-5 mr-3" />
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 h-16 flex items-center">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="ml-3 flex items-center">
          <div className="h-8 w-8 bg-brand-dark rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="ml-2 font-semibold text-gray-900">Shelfdrop</span>
        </div>
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
            <NavContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
        <NavContent />
      </div>
    </>
  )
}
