export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Megaphone, Plus, Clock, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import BrandPromotionsTable from './BrandPromotionsTable'

export default async function BrandPromotionsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get brand
  const { data: brand } = await supabase
    .from('brands')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!brand) {
    redirect('/onboarding')
  }

  // Get promotions for this brand
  const { data: promotions } = await supabase
    .from('promotions')
    .select('*, brand_products(id, product_name, sku_code)')
    .eq('brand_id', brand.id)
    .order('created_at', { ascending: false })

  const pendingFromAdmin = promotions?.filter(p =>
    p.promotion_type === 'admin_created' && p.status === 'pending'
  ).length || 0

  const mySuggestions = promotions?.filter(p =>
    p.promotion_type === 'brand_suggested'
  ).length || 0

  const activeCount = promotions?.filter(p =>
    p.status === 'active' || p.status === 'approved'
  ).length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="text-gray-600 mt-1">View and respond to promotional campaigns</p>
        </div>
        <Link
          href="/promotions/suggest"
          className="px-4 py-2 bg-shelfdrop-green text-black rounded-lg hover:bg-green-400 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Suggest Promotion
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingFromAdmin}</p>
              <p className="text-sm text-gray-500">Awaiting Your Response</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Megaphone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{mySuggestions}</p>
              <p className="text-sm text-gray-500">Your Suggestions</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
              <p className="text-sm text-gray-500">Active / Approved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Promotions */}
      {promotions && promotions.length > 0 ? (
        <BrandPromotionsTable promotions={promotions} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">No Promotions Yet</h2>
          <p className="text-gray-500 mb-4">
            Shelfdrop will send promotional opportunities here, or you can suggest your own.
          </p>
          <Link
            href="/promotions/suggest"
            className="inline-flex items-center gap-2 px-4 py-2 bg-shelfdrop-green text-black rounded-lg hover:bg-green-400"
          >
            <Plus className="w-4 h-4" />
            Suggest a Promotion
          </Link>
        </div>
      )}
    </div>
  )
}
