'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  LogOut,
  Building2,
  ClipboardCheck,
  Database,
  History,
  Package,
  CheckSquare,
  Megaphone,
  MessageSquare,
  Truck,
  BarChart3,
  Receipt,
  Users
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const brandNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/orders', label: 'Purchase Orders', icon: ShoppingCart },
  { href: '/shipments', label: 'Shipments', icon: Truck },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/promotions', label: 'Promotions', icon: Megaphone },
  { href: '/reports', label: 'Reports & P&L', icon: BarChart3 },
  { href: '/expansion', label: 'Market Expansion', icon: Receipt },
  { href: '/support', label: 'Support', icon: MessageSquare },
]

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/brands', label: 'Brands', icon: Building2 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/approvals', label: 'Brand Approvals', icon: ClipboardCheck },
  { href: '/admin/product-approvals', label: 'Product Approvals', icon: CheckSquare },
  { href: '/admin/products', label: 'All Products', icon: Package },
  { href: '/admin/shipments', label: 'Shipments', icon: Truck },
  { href: '/admin/duties', label: 'Duties & Bond', icon: Receipt },
  { href: '/admin/invoices', label: 'Invoices', icon: FileText },
  { href: '/admin/promotions', label: 'Promotions', icon: Megaphone },
  { href: '/admin/reports', label: 'All Reports', icon: BarChart3 },
  { href: '/admin/support', label: 'Support', icon: MessageSquare },
  { href: '/admin/logs', label: 'Audit Logs', icon: History },
  { href: '/admin/data', label: 'Data Management', icon: Database },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setIsAdmin(user.email === 'george@shelfdrop.com')
      }
      setLoading(false)
    }
    checkRole()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const navItems = isAdmin ? adminNavItems : brandNavItems

  if (loading) {
    return (
      <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-8"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-4">
        <Link href={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-semibold text-gray-900">Shelfdrop</span>
        </Link>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-shelfdrop-green text-black'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 w-full text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
