import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
import { Clock, CheckCircle, XCircle, Building2, Calendar, ExternalLink } from 'lucide-react'

export default async function ApprovalsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Verify admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') redirect('/dashboard')

  // Fetch all brands with their status
  const { data: brands } = await supabase
    .from('brands')
    .select('*')
    .order('submitted_at', { ascending: false })

  const pendingBrands = brands?.filter(b => b.status === 'pending') || []
  const approvedBrands = brands?.filter(b => b.status === 'approved') || []
  const rejectedBrands = brands?.filter(b => b.status === 'rejected') || []

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Brand Approvals</h1>
        <p className="text-gray-600">Review and approve brand applications</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Review</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingBrands.length}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-3xl font-bold text-green-600">{approvedBrands.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{rejectedBrands.length}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Pending Applications ({pendingBrands.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingBrands.length > 0 ? (
            <div className="space-y-4">
              {pendingBrands.map((brand) => (
                <div key={brand.id} className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-white rounded-lg">
                        <Building2 className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {brand.legal_company_name || brand.name || 'Unnamed Brand'}
                        </h3>
                        {brand.trading_name && brand.trading_name !== brand.legal_company_name && (
                          <p className="text-sm text-gray-500">Trading as: {brand.trading_name}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Submitted: {formatDate(brand.submitted_at)}
                          </span>
                          {brand.primary_category && (
                            <span>Category: {brand.primary_category}</span>
                          )}
                          {brand.estimated_sku_count && (
                            <span>SKUs: {brand.estimated_sku_count}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/admin/approvals/${brand.id}`}
                      className="px-4 py-2 bg-brand-accent text-white text-sm font-medium rounded-lg hover:bg-brand-dark transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto text-green-300 mb-3" />
              <p>No pending applications</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recently Processed */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Processed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Brand</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Submitted</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Processed</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {[...approvedBrands, ...rejectedBrands]
                  .sort((a, b) => new Date(b.approved_at || 0).getTime() - new Date(a.approved_at || 0).getTime())
                  .slice(0, 10)
                  .map((brand) => (
                    <tr key={brand.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {brand.legal_company_name || brand.name}
                          </p>
                          {brand.trading_name && (
                            <p className="text-sm text-gray-500">{brand.trading_name}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {brand.primary_category || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(brand.submitted_at)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={brand.status === 'approved' ? 'success' : 'danger'}>
                          {brand.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(brand.approved_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/approvals/${brand.id}`}
                          className="text-brand-accent hover:underline text-sm"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                {approvedBrands.length === 0 && rejectedBrands.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No processed applications yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
