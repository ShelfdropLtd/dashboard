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

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [brandId, setBrandId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    // Company Details
    company_name: '',
    trading_name: '',
    company_number: '',
    vat_number: '',
    registered_address: '',
    website: '',
    year_founded: '',
    // Key Contacts
    primary_contact_name: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    primary_contact_role: '',
    finance_contact_name: '',
    finance_contact_email: '',
    // Bank Details
    bank_name: '',
    bank_account_name: '',
    bank_sort_code: '',
    bank_account_number: '',
    // Compliance
    awrs_number: '',
    has_alcohol_license: false,
    wowgr_registered: false,
    has_product_liability: false,
    // Products
    product_categories: [] as string[],
    sku_count: '',
    abv_range: '',
    product_description: '',
    // Sales Channels
    current_channels: [] as string[],
    target_channels: [] as string[],
    amazon_experience: '',
    monthly_revenue: '',
    // Commercial Terms
    rrp_range: '',
    target_margin: '',
    promo_budget: '',
    exclusivity_preference: '',
    // Stock & Logistics
    stock_location: '',
    initial_stock_qty: '',
    lead_time: '',
    needs_bonded: false,
    // Brand Assets
    brand_story: '',
    logo_url: '',
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadUserAndBrand() {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUserId(user.id)

      // Check for existing brand
      const { data: brand } = await supabase
        .from('brands')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (brand) {
        setBrandId(brand.id)
        // If already submitted, redirect based on status
        if (brand.onboarding_status === 'pending') {
          router.push('/onboarding/pending')
          return
        }
        if (brand.onboarding_status === 'approved') {
          router.push('/onboarding/pricing')
          return
        }
        // Load existing data
        setFormData(prev => ({
          ...prev,
          ...brand,
          product_categories: brand.product_categories || [],
          current_channels: brand.current_channels || [],
          target_channels: brand.target_channels || [],
        }))
      }

      setLoading(false)
    }

    loadUserAndBrand()
  }, [supabase, router])

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!userId) {
      alert('User not found. Please log in again.')
      return
    }

    setSaving(true)

    try {
      const dataToSave = {
        ...formData,
        user_id: userId,
        updated_at: new Date().toISOString(),
      }

      if (brandId) {
        // Update existing brand
        const { error } = await supabase
          .from('brands')
          .update(dataToSave)
          .eq('id', brandId)

        if (error) throw error
      } else {
        // Create new brand
        const { data, error } = await supabase
          .from('brands')
          .insert({
            ...dataToSave,
            onboarding_status: 'draft',
            created_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) throw error
        if (data) setBrandId(data.id)
      }
    } catch (error: any) {
      console.error('Save error:', error)
      alert(`Failed to save: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!userId) {
      alert('User not found. Please log in again.')
      return
    }

    setSaving(true)

    try {
      const dataToSave = {
        ...formData,
        user_id: userId,
        onboarding_status: 'pending',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (brandId) {
        const { error } = await supabase
          .from('brands')
          .update(dataToSave)
          .eq('id', brandId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('brands')
          .insert({
            ...dataToSave,
            created_at: new Date().toISOString(),
          })

        if (error) throw error
      }

      router.push('/onboarding/pending')
    } catch (error: any) {
      console.error('Submit error:', error)
      alert(`Failed to submit: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const nextStep = async () => {
    await handleSave()
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#F15A2B]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Brand Onboarding</h1>
            <span className="text-sm text-gray-500">Step {currentStep} of {STEPS.length}</span>
          </div>
          <div className="flex gap-1">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`h-2 flex-1 rounded-full ${
                  step.id <= currentStep ? 'bg-[#F15A2B]' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-sm text-gray-600">{STEPS[currentStep - 1].name}</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => updateField('company_name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trading Name</label>
                  <input
                    type="text"
                    value={formData.trading_name}
                    onChange={(e) => updateField('trading_name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Number</label>
                  <input
                    type="text"
                    value={formData.company_number}
                    onChange={(e) => updateField('company_number', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">VAT Number</label>
                  <input
                    type="text"
                    value={formData.vat_number}
                    onChange={(e) => updateField('vat_number', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year Founded</label>
                  <input
                    type="text"
                    value={formData.year_founded}
                    onChange={(e) => updateField('year_founded', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registered Address</label>
                  <textarea
                    value={formData.registered_address}
                    onChange={(e) => updateField('registered_address', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Contacts</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact Name *</label>
                  <input
                    type="text"
                    value={formData.primary_contact_name}
                    onChange={(e) => updateField('primary_contact_name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact Email *</label>
                  <input
                    type="email"
                    value={formData.primary_contact_email}
                    onChange={(e) => updateField('primary_contact_email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.primary_contact_phone}
                    onChange={(e) => updateField('primary_contact_phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact Role</label>
                  <input
                    type="text"
                    value={formData.primary_contact_role}
                    onChange={(e) => updateField('primary_contact_role', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Finance Contact Name</label>
                  <input
                    type="text"
                    value={formData.finance_contact_name}
                    onChange={(e) => updateField('finance_contact_name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Finance Contact Email</label>
                  <input
                    type="email"
                    value={formData.finance_contact_email}
                    onChange={(e) => updateField('finance_contact_email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => updateField('bank_name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                  <input
                    type="text"
                    value={formData.bank_account_name}
                    onChange={(e) => updateField('bank_account_name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort Code</label>
                  <input
                    type="text"
                    value={formData.bank_sort_code}
                    onChange={(e) => updateField('bank_sort_code', e.target.value)}
                    placeholder="00-00-00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={formData.bank_account_number}
                    onChange={(e) => updateField('bank_account_number', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Compliance</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">AWRS Number</label>
                  <input
                    type="text"
                    value={formData.awrs_number}
                    onChange={(e) => updateField('awrs_number', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.has_alcohol_license}
                      onChange={(e) => updateField('has_alcohol_license', e.target.checked)}
                      className="w-5 h-5 text-[#F15A2B] border-gray-300 rounded focus:ring-[#F15A2B]"
                    />
                    <span className="text-gray-700">We have an alcohol premises license</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.wowgr_registered}
                      onChange={(e) => updateField('wowgr_registered', e.target.checked)}
                      className="w-5 h-5 text-[#F15A2B] border-gray-300 rounded focus:ring-[#F15A2B]"
                    />
                    <span className="text-gray-700">WOWGR Registered</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.has_product_liability}
                      onChange={(e) => updateField('has_product_liability', e.target.checked)}
                      className="w-5 h-5 text-[#F15A2B] border-gray-300 rounded focus:ring-[#F15A2B]"
                    />
                    <span className="text-gray-700">We have product liability insurance</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Products</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of SKUs</label>
                  <input
                    type="number"
                    value={formData.sku_count}
                    onChange={(e) => updateField('sku_count', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ABV Range</label>
                  <input
                    type="text"
                    value={formData.abv_range}
                    onChange={(e) => updateField('abv_range', e.target.value)}
                    placeholder="e.g., 4% - 40%"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Description</label>
                  <textarea
                    value={formData.product_description}
                    onChange={(e) => updateField('product_description', e.target.value)}
                    rows={4}
                    placeholder="Tell us about your products..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Channels</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amazon Experience</label>
                  <select
                    value={formData.amazon_experience}
                    onChange={(e) => updateField('amazon_experience', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  >
                    <option value="">Select...</option>
                    <option value="none">No experience</option>
                    <option value="seller">Seller Central experience</option>
                    <option value="vendor">Vendor Central experience</option>
                    <option value="both">Both Seller and Vendor experience</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Monthly Revenue</label>
                  <select
                    value={formData.monthly_revenue}
                    onChange={(e) => updateField('monthly_revenue', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  >
                    <option value="">Select...</option>
                    <option value="0-10k">£0 - £10,000</option>
                    <option value="10k-50k">£10,000 - £50,000</option>
                    <option value="50k-100k">£50,000 - £100,000</option>
                    <option value="100k+">£100,000+</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 7 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Commercial Terms</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RRP Range</label>
                  <input
                    type="text"
                    value={formData.rrp_range}
                    onChange={(e) => updateField('rrp_range', e.target.value)}
                    placeholder="e.g., £15 - £45"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Margin</label>
                  <input
                    type="text"
                    value={formData.target_margin}
                    onChange={(e) => updateField('target_margin', e.target.value)}
                    placeholder="e.g., 30%"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Promotional Budget</label>
                  <input
                    type="text"
                    value={formData.promo_budget}
                    onChange={(e) => updateField('promo_budget', e.target.value)}
                    placeholder="Monthly budget for promotions"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exclusivity Preference</label>
                  <select
                    value={formData.exclusivity_preference}
                    onChange={(e) => updateField('exclusivity_preference', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  >
                    <option value="">Select...</option>
                    <option value="exclusive">Exclusive partnership</option>
                    <option value="non-exclusive">Non-exclusive</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 8 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Stock & Logistics</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock Location</label>
                  <input
                    type="text"
                    value={formData.stock_location}
                    onChange={(e) => updateField('stock_location', e.target.value)}
                    placeholder="Where is your stock currently held?"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock Quantity</label>
                  <input
                    type="text"
                    value={formData.initial_stock_qty}
                    onChange={(e) => updateField('initial_stock_qty', e.target.value)}
                    placeholder="Units available for initial shipment"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lead Time</label>
                  <input
                    type="text"
                    value={formData.lead_time}
                    onChange={(e) => updateField('lead_time', e.target.value)}
                    placeholder="e.g., 2-3 weeks"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.needs_bonded}
                    onChange={(e) => updateField('needs_bonded', e.target.checked)}
                    className="w-5 h-5 text-[#F15A2B] border-gray-300 rounded focus:ring-[#F15A2B]"
                  />
                  <span className="text-gray-700">We need bonded warehouse storage</span>
                </label>
              </div>
            </div>
          )}

          {currentStep === 9 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Brand Assets</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand Story</label>
                  <textarea
                    value={formData.brand_story}
                    onChange={(e) => updateField('brand_story', e.target.value)}
                    rows={5}
                    placeholder="Tell us about your brand, its history, and what makes it unique..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                  <input
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => updateField('logo_url', e.target.value)}
                    placeholder="Link to your logo file"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F15A2B] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {currentStep < STEPS.length ? (
              <button
                onClick={nextStep}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-[#F15A2B] text-white rounded-xl hover:bg-[#D14A1F] transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-[#F15A2B] text-white rounded-xl hover:bg-[#D14A1F] transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
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
