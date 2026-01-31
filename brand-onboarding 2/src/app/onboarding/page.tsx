'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'

const STEPS = [
  { id: 1, name: 'Company Details' },
  { id: 2, name: 'Key Contacts' },
  { id: 3, name: 'Bank Details' },
  { id: 4, name: 'Compliance' },
  { id: 5, name: 'Products' },
  { id: 6, name: 'Sales Channels' },
  { id: 7, name: 'Commercial Terms' },
  { id: 8, name: 'Stock & Logistics' },
  { id: 9, name: 'Brand Assets' },
]

const SKU_OPTIONS = ['1-10', '11-25', '26-50', '51-100', '100+']
const CATEGORY_OPTIONS = ['Spirits', 'Wine', 'Beer', 'Cider', 'RTD/Cocktails', 'Non-Alcoholic', 'Other']
const CHANNEL_OPTIONS = ['Amazon', 'Shopify D2C', 'Tesco Marketplace', 'Ocado', 'Master of Malt', 'Zapp', 'Trade/Wholesale']
const TERRITORY_OPTIONS = ['UK', 'EU', 'USA', 'Rest of World']
const AMAZON_STATUS_OPTIONS = ['Registered', 'Pending', 'Not Registered', 'Not Interested']
const TIER_OPTIONS = ['Starter', 'Growth', 'Enterprise']
const DUTY_OPTIONS = ['Shelfdrop to handle', 'Brand to handle', 'Discuss further']

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [brandId, setBrandId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    // Company Details
    legal_company_name: '',
    trading_name: '',
    company_number: '',
    vat_number: '',
    business_address: '',
    website: '',
    phone: '',
    // Key Contacts
    primary_contact_name: '',
    primary_contact_email: '',
    finance_contact_name: '',
    finance_contact_email: '',
    // Bank Details
    bank_account_name: '',
    bank_account_number: '',
    bank_sort_code: '',
    bank_iban: '',
    bank_swift: '',
    bank_country: '',
    bank_can_receive_gbp: true,
    // Compliance
    awrs_number: '',
    license_holder_name: '',
    uk_compliant_labelling: false,
    products_in_bond: false,
    bond_warehouse_location: '',
    // Products
    estimated_sku_count: '',
    primary_category: '',
    same_case_size: false,
    standard_case_size: '',
    // Sales Channels
    sales_channels: [] as string[],
    territories: [] as string[],
    amazon_brand_registry: '',
    // Commercial Terms
    shelfdrop_tier: '',
    duty_financing_preference: '',
    immediate_payment_interest: false,
    // Stock & Logistics
    current_stock_location: '',
    initial_stock_quantity: '',
    // Brand Assets
    brand_guidelines_url: '',
    brand_logo_url: '',
    master_product_sheet_url: '',
    declaration_accepted: false,
  })

  useEffect(() => {
    checkUserAndBrand()
  }, [])

  const checkUserAndBrand = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth/login')
      return
    }

    // Check if user already has a brand
    const { data: userData } = await supabase
      .from('users')
      .select('brand_id, role')
      .eq('id', user.id)
      .single()

    if (userData?.role === 'admin') {
      router.push('/admin')
      return
    }

    if (userData?.brand_id) {
      // Check brand status
      const { data: brand } = await supabase
        .from('brands')
        .select('status')
        .eq('id', userData.brand_id)
        .single()

      if (brand?.status === 'approved') {
        router.push('/dashboard')
        return
      } else if (brand?.status === 'pending') {
        router.push('/onboarding/pending')
        return
      }

      // Load existing brand data
      setBrandId(userData.brand_id)
      const { data: brandData } = await supabase
        .from('brands')
        .select('*')
        .eq('id', userData.brand_id)
        .single()

      if (brandData) {
        setFormData(prev => ({
          ...prev,
          ...brandData,
          sales_channels: brandData.sales_channels || [],
          territories: brandData.territories || [],
        }))
      }
    }

    setLoading(false)
  }

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleArrayField = (field: 'sales_channels' | 'territories', value: string) => {
    setFormData(prev => {
      const current = prev[field]
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(v => v !== value) }
      }
      return { ...prev, [field]: [...current, value] }
    })
  }

  const saveProgress = async () => {
    setSaving(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (brandId) {
        // Update existing brand
        const { error } = await supabase
          .from('brands')
          .update(formData)
          .eq('id', brandId)

        if (error) throw error
      } else {
        // Create new brand and link to user
        const { data: newBrand, error: createError } = await supabase
          .from('brands')
          .insert({
            name: formData.legal_company_name || formData.trading_name || 'New Brand',
            ...formData,
            status: 'draft',
          })
          .select()
          .single()

        if (createError) throw createError

        // Link user to brand
        await supabase
          .from('users')
          .update({ brand_id: newBrand.id })
          .eq('id', user.id)

        setBrandId(newBrand.id)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save progress')
    } finally {
      setSaving(false)
    }
  }

  const submitApplication = async () => {
    if (!formData.declaration_accepted) {
      setError('Please accept the declaration to submit')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await saveProgress()

      const { error } = await supabase
        .from('brands')
        .update({
          status: 'pending',
          submitted_at: new Date().toISOString(),
          name: formData.legal_company_name || formData.trading_name,
        })
        .eq('id', brandId)

      if (error) throw error

      router.push('/onboarding/pending')
    } catch (err: any) {
      setError(err.message || 'Failed to submit application')
    } finally {
      setSaving(false)
    }
  }

  const nextStep = async () => {
    await saveProgress()
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-brand-accent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-brand-dark rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Shelfdrop Onboarding</h1>
              <p className="text-sm text-gray-500">Complete your brand profile</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b overflow-x-auto">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 min-w-max">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    currentStep === step.id
                      ? 'bg-brand-accent text-white'
                      : currentStep > step.id
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                  <span className="hidden sm:inline">{step.name}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-gray-300 mx-1" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border p-6">
          {/* Step 1: Company Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Company Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Legal Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.legal_company_name}
                    onChange={(e) => updateField('legal_company_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trading Name (if different)
                  </label>
                  <input
                    type="text"
                    value={formData.trading_name}
                    onChange={(e) => updateField('trading_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Number
                  </label>
                  <input
                    type="text"
                    value={formData.company_number}
                    onChange={(e) => updateField('company_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    VAT Number
                  </label>
                  <input
                    type="text"
                    value={formData.vat_number}
                    onChange={(e) => updateField('vat_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Address *
                </label>
                <textarea
                  value={formData.business_address}
                  onChange={(e) => updateField('business_address', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website *
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                    placeholder="https://"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Contact Mobile *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Key Contacts */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Key Contacts</h2>

              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                <h3 className="font-medium text-gray-700">Primary Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.primary_contact_name}
                      onChange={(e) => updateField('primary_contact_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.primary_contact_email}
                      onChange={(e) => updateField('primary_contact_email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                <h3 className="font-medium text-gray-700">Finance Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.finance_contact_name}
                      onChange={(e) => updateField('finance_contact_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.finance_contact_email}
                      onChange={(e) => updateField('finance_contact_email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Bank Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Bank Details for Settlement</h2>
              <p className="text-sm text-gray-500">These details will be used to pay you for sales</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Name *
                  </label>
                  <input
                    type="text"
                    value={formData.bank_account_name}
                    onChange={(e) => updateField('bank_account_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    value={formData.bank_account_number}
                    onChange={(e) => updateField('bank_account_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort Code *
                  </label>
                  <input
                    type="text"
                    value={formData.bank_sort_code}
                    onChange={(e) => updateField('bank_sort_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                    placeholder="00-00-00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IBAN (if applicable)
                  </label>
                  <input
                    type="text"
                    value={formData.bank_iban}
                    onChange={(e) => updateField('bank_iban', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    BIC/SWIFT (if applicable)
                  </label>
                  <input
                    type="text"
                    value={formData.bank_swift}
                    onChange={(e) => updateField('bank_swift', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Country *
                  </label>
                  <input
                    type="text"
                    value={formData.bank_country}
                    onChange={(e) => updateField('bank_country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.bank_can_receive_gbp}
                    onChange={(e) => updateField('bank_can_receive_gbp', e.target.checked)}
                    className="rounded border-gray-300 text-brand-accent focus:ring-brand-accent"
                  />
                  <span className="text-sm text-gray-700">Bank account can receive GBP</span>
                </label>
              </div>
            </div>
          )}

          {/* Step 4: Compliance */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Compliance & Licensing</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    AWRS Number
                  </label>
                  <input
                    type="text"
                    value={formData.awrs_number}
                    onChange={(e) => updateField('awrs_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Licence Holder Name
                  </label>
                  <input
                    type="text"
                    value={formData.license_holder_name}
                    onChange={(e) => updateField('license_holder_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.uk_compliant_labelling}
                    onChange={(e) => updateField('uk_compliant_labelling', e.target.checked)}
                    className="rounded border-gray-300 text-brand-accent focus:ring-brand-accent"
                  />
                  <span className="text-sm text-gray-700">Products have UK-compliant labelling</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.products_in_bond}
                    onChange={(e) => updateField('products_in_bond', e.target.checked)}
                    className="rounded border-gray-300 text-brand-accent focus:ring-brand-accent"
                  />
                  <span className="text-sm text-gray-700">Products are currently held in bond</span>
                </label>
              </div>

              {formData.products_in_bond && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bond Warehouse Name/Location
                  </label>
                  <input
                    type="text"
                    value={formData.bond_warehouse_location}
                    onChange={(e) => updateField('bond_warehouse_location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 5: Products */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Products</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Total Number of SKUs *
                  </label>
                  <select
                    value={formData.estimated_sku_count}
                    onChange={(e) => updateField('estimated_sku_count', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                    required
                  >
                    <option value="">Select...</option>
                    {SKU_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Category *
                  </label>
                  <select
                    value={formData.primary_category}
                    onChange={(e) => updateField('primary_category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                    required
                  >
                    <option value="">Select...</option>
                    {CATEGORY_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.same_case_size}
                    onChange={(e) => updateField('same_case_size', e.target.checked)}
                    className="rounded border-gray-300 text-brand-accent focus:ring-brand-accent"
                  />
                  <span className="text-sm text-gray-700">All products share the same case size</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Standard Case Size (bottles per case)
                </label>
                <input
                  type="text"
                  value={formData.standard_case_size}
                  onChange={(e) => updateField('standard_case_size', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                  placeholder="e.g. 6, 12"
                />
              </div>
            </div>
          )}

          {/* Step 6: Sales Channels */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Sales Channels</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sales Channels of Interest *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CHANNEL_OPTIONS.map(channel => (
                    <label key={channel} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.sales_channels.includes(channel)}
                        onChange={() => toggleArrayField('sales_channels', channel)}
                        className="rounded border-gray-300 text-brand-accent focus:ring-brand-accent"
                      />
                      <span className="text-sm text-gray-700">{channel}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Territories of Interest *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TERRITORY_OPTIONS.map(territory => (
                    <label key={territory} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.territories.includes(territory)}
                        onChange={() => toggleArrayField('territories', territory)}
                        className="rounded border-gray-300 text-brand-accent focus:ring-brand-accent"
                      />
                      <span className="text-sm text-gray-700">{territory}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amazon Brand Registry Status *
                </label>
                <select
                  value={formData.amazon_brand_registry}
                  onChange={(e) => updateField('amazon_brand_registry', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                  required
                >
                  <option value="">Select...</option>
                  {AMAZON_STATUS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 7: Commercial Terms */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Commercial Terms</h2>
              <p className="text-sm text-gray-500">
                Please review our pricing at{' '}
                <a href="https://shelfdrop.co/pricing" target="_blank" className="text-brand-accent underline">
                  shelfdrop.co/pricing
                </a>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selected Shelfdrop Tier *
                  </label>
                  <select
                    value={formData.shelfdrop_tier}
                    onChange={(e) => updateField('shelfdrop_tier', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                    required
                  >
                    <option value="">Select...</option>
                    {TIER_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alcohol Duty Financing Preference *
                  </label>
                  <select
                    value={formData.duty_financing_preference}
                    onChange={(e) => updateField('duty_financing_preference', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                    required
                  >
                    <option value="">Select...</option>
                    {DUTY_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.immediate_payment_interest}
                    onChange={(e) => updateField('immediate_payment_interest', e.target.checked)}
                    className="rounded border-gray-300 text-brand-accent focus:ring-brand-accent"
                  />
                  <span className="text-sm text-gray-700">
                    Interested in immediate payment (skipping 60-day payment terms)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Step 8: Stock & Logistics */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Initial Stock & Logistics</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock Location *
                </label>
                <input
                  type="text"
                  value={formData.current_stock_location}
                  onChange={(e) => updateField('current_stock_location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                  placeholder="e.g. Warehouse in London, Bond in Glasgow"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Stock Quantity (units) *
                </label>
                <input
                  type="text"
                  value={formData.initial_stock_quantity}
                  onChange={(e) => updateField('initial_stock_quantity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                  placeholder="Approximate number of units to send"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 9: Brand Assets */}
          {currentStep === 9 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Brand Checklist</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Guidelines (URL)
                </label>
                <input
                  type="url"
                  value={formData.brand_guidelines_url}
                  onChange={(e) => updateField('brand_guidelines_url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                  placeholder="Link to Dropbox, Drive, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Logo (URL)
                </label>
                <input
                  type="url"
                  value={formData.brand_logo_url}
                  onChange={(e) => updateField('brand_logo_url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                  placeholder="Link to high-res logo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Master Product Sheet (URL) *
                </label>
                <input
                  type="url"
                  value={formData.master_product_sheet_url}
                  onChange={(e) => updateField('master_product_sheet_url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent"
                  placeholder="Link to your completed product sheet"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Please complete the Shelfdrop Master Product Sheet and share the link here
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                <h3 className="font-medium text-gray-900">Declaration</h3>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.declaration_accepted}
                    onChange={(e) => updateField('declaration_accepted', e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-brand-accent focus:ring-brand-accent"
                  />
                  <span className="text-sm text-gray-700">
                    I confirm that the information provided in this form is accurate and complete.
                    I have the authority to enter into a trading relationship on behalf of the company
                    named above. I understand that Shelfdrop will use this information to set up our
                    account and begin trading.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            {currentStep < STEPS.length ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-accent rounded-lg hover:bg-brand-dark disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={submitApplication}
                disabled={saving || !formData.declaration_accepted}
                className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Submit Application
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
