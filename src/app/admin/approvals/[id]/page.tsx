import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
import ApprovalActions from './ApprovalActions'
import {
  Building2,
  User,
  CreditCard,
  Shield,
  Package,
  Store,
  FileText,
  Truck,
  ExternalLink,
  ArrowLeft
} from 'lucide-react'

export default async function ApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  // Fetch brand details
  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('id', id)
    .single()

  if (!brand) notFound()

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const InfoRow = ({ label, value, link }: { label: string; value: string | null | undefined; link?: boolean }) => (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      {link && value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-accent hover:underline flex items-center gap-1">
          View <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <span className="text-sm font-medium text-gray-900">{value || '-'}</span>
      )}
    </div>
  )

  const CheckRow = ({ label, value }: { label: string; value: boolean | null | undefined }) => (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium ${value ? 'text-green-600' : 'text-gray-400'}`}>
        {value ? '✓ Yes' : '✗ No'}
      </span>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/approvals"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {brand.legal_company_name || brand.name || 'Brand Application'}
            </h1>
            <p className="text-gray-600">
              {brand.trading_name && brand.trading_name !== brand.legal_company_name && (
                <span>Trading as: {brand.trading_name} • </span>
              )}
              Submitted: {formatDate(brand.submitted_at)}
            </p>
          </div>
        </div>
        <Badge
          variant={
            brand.status === 'approved' ? 'success' :
            brand.status === 'rejected' ? 'danger' :
            brand.status === 'pending' ? 'warning' : 'default'
          }
          className="text-base px-4 py-1"
        >
          {brand.status || 'draft'}
        </Badge>
      </div>

      {/* Approval Actions */}
      {brand.status === 'pending' && (
        <ApprovalActions brandId={brand.id} brandName={brand.legal_company_name || brand.name} />
      )}

      {/* Rejection Reason */}
      {brand.status === 'rejected' && brand.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
          <p className="text-sm text-red-700">{brand.rejection_reason}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-400" />
              Company Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Legal Company Name" value={brand.legal_company_name} />
            <InfoRow label="Trading Name" value={brand.trading_name} />
            <InfoRow label="Company Number" value={brand.company_number} />
            <InfoRow label="VAT Number" value={brand.vat_number} />
            <InfoRow label="Business Address" value={brand.business_address} />
            <InfoRow label="Website" value={brand.website} link />
            <InfoRow label="Phone" value={brand.phone} />
          </CardContent>
        </Card>

        {/* Key Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-400" />
              Key Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">Primary Contact</p>
              <InfoRow label="Name" value={brand.primary_contact_name} />
              <InfoRow label="Email" value={brand.primary_contact_email} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">Finance Contact</p>
              <InfoRow label="Name" value={brand.finance_contact_name} />
              <InfoRow label="Email" value={brand.finance_contact_email} />
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gray-400" />
              Bank Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Account Name" value={brand.bank_account_name} />
            <InfoRow label="Account Number" value={brand.bank_account_number ? '••••' + brand.bank_account_number.slice(-4) : null} />
            <InfoRow label="Sort Code" value={brand.bank_sort_code} />
            <InfoRow label="IBAN" value={brand.bank_iban} />
            <InfoRow label="BIC/SWIFT" value={brand.bank_swift} />
            <InfoRow label="Bank Country" value={brand.bank_country} />
            <CheckRow label="Can Receive GBP" value={brand.bank_can_receive_gbp} />
          </CardContent>
        </Card>

        {/* Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-400" />
              Compliance & Licensing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="AWRS Number" value={brand.awrs_number} />
            <InfoRow label="Licence Holder" value={brand.license_holder_name} />
            <CheckRow label="UK-Compliant Labelling" value={brand.uk_compliant_labelling} />
            <CheckRow label="Products in Bond" value={brand.products_in_bond} />
            {brand.products_in_bond && (
              <InfoRow label="Bond Location" value={brand.bond_warehouse_location} />
            )}
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-gray-400" />
              Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Estimated SKUs" value={brand.estimated_sku_count} />
            <InfoRow label="Primary Category" value={brand.primary_category} />
            <CheckRow label="Same Case Size" value={brand.same_case_size} />
            <InfoRow label="Standard Case Size" value={brand.standard_case_size} />
          </CardContent>
        </Card>

        {/* Sales Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-gray-400" />
              Sales Channels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500 block mb-2">Channels of Interest</span>
              <div className="flex flex-wrap gap-1">
                {brand.sales_channels?.map((channel: string) => (
                  <span key={channel} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {channel}
                  </span>
                )) || <span className="text-sm text-gray-400">None selected</span>}
              </div>
            </div>
            <div className="py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500 block mb-2">Territories</span>
              <div className="flex flex-wrap gap-1">
                {brand.territories?.map((territory: string) => (
                  <span key={territory} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    {territory}
                  </span>
                )) || <span className="text-sm text-gray-400">None selected</span>}
              </div>
            </div>
            <InfoRow label="Amazon Brand Registry" value={brand.amazon_brand_registry} />
          </CardContent>
        </Card>

        {/* Commercial Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-400" />
              Commercial Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Shelfdrop Tier" value={brand.shelfdrop_tier} />
            <InfoRow label="Duty Financing" value={brand.duty_financing_preference} />
            <CheckRow label="Immediate Payment Interest" value={brand.immediate_payment_interest} />
          </CardContent>
        </Card>

        {/* Stock & Logistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-gray-400" />
              Stock & Logistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Current Stock Location" value={brand.current_stock_location} />
            <InfoRow label="Initial Stock Quantity" value={brand.initial_stock_quantity} />
          </CardContent>
        </Card>
      </div>

      {/* Brand Assets */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Brand Guidelines</p>
              {brand.brand_guidelines_url ? (
                <a href={brand.brand_guidelines_url} target="_blank" className="text-brand-accent hover:underline flex items-center gap-1">
                  View Guidelines <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <span className="text-sm text-gray-400">Not provided</span>
              )}
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Brand Logo</p>
              {brand.brand_logo_url ? (
                <a href={brand.brand_logo_url} target="_blank" className="text-brand-accent hover:underline flex items-center gap-1">
                  View Logo <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <span className="text-sm text-gray-400">Not provided</span>
              )}
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Master Product Sheet</p>
              {brand.master_product_sheet_url ? (
                <a href={brand.master_product_sheet_url} target="_blank" className="text-brand-accent hover:underline flex items-center gap-1">
                  View Sheet <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <span className="text-sm text-gray-400">Not provided</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Declaration */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            {brand.declaration_accepted ? (
              <>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600">✓</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Declaration Accepted</p>
                  <p className="text-sm text-gray-500">
                    The applicant confirmed the information is accurate and they have authority to trade
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600">✗</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Declaration Not Accepted</p>
                  <p className="text-sm text-gray-500">
                    The applicant has not accepted the declaration
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
