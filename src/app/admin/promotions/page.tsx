export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Megaphone, Plus, Clock, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import PromotionsTable from './PromotionsTable'

export default async function AdminPromotionsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'george@shelfdrop.com') {
    redirect('/auth/login')
  }

  // Get all promotions
  const { data: promotions } = await supabase
    .from('promotions')
    .select('*, brands(id, company_name, name), brand_products(id, product_name, sku_code)')
    .order('created_at', { ascending: false })

  // Get brands for the create form
  const { data: brands } = await supabase
    .from('brands')
    .select('id, company_name, name')
    .eq('status', 'approved')
    .order('company_name')

  const pendingCount = promotions?.filter(p => p.status === 'pending').length || 0
  const activeCount = promotions?.filter(p => p.status === 'active').length || 0
  const brandSuggestedCount = promotions?.filter(p => p.promotion_type === 'brand_suggested' && p.status === 'pending').length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="text-gray-600 mt-1">Manage promotional campaigns with brands</p>
        </div>
        <Link
          href="/admin/promotions/create"
          className="px-4 py-2 bg-shelfdrop-green text-black rounded-lg hover:bg-green-400 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Promotion
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
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              <p className="text-sm text-gray-500">Awaiting Brand Response</p>
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
              <p className="text-sm text-gray-500">Active Promotions</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Megaphone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{brandSuggestedCount}</p>
              <p className="text-sm text-gray-500">Brand Suggestions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Promotions Table */}
      {promotions && promotions.length > 0 ? (
        <PromotionsTable promotions={promotions} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">No Promotions Yet</h2>
          <p className="text-gray-500 mb-4">Create your first promotion to get started.</p>
          <Link
            href="/admin/promotions/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-shelfdrop-green text-black rounded-lg hover:bg-green-400"
          >
            <Plus className="w-4 h-4" />
            Create Promotion
          </Link>
        </div>
      )}
    </div>
  )
}
