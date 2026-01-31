'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Building2, User, Globe, Package } from 'lucide-react'

const channels = [
  'Amazon',
  'Tesco',
  'Ocado',
  'Shopify D2C',
  'Zapp',
  'Master of Malt',
  'Trade/Wholesale',
  'Other',
]

const categories = [
  'Gin',
  'Whisky',
  'Vodka',
  'Rum',
  'Tequila',
  'Wine',
  'Beer',
  'RTD/Cocktails',
  'Non-Alcoholic',
  'Other',
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Form data
  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [currentChannels, setCurrentChannels] = useState<string[]>([])
  const [targetChannels, setTargetChannels] = useState<string[]>([])
  const [productCategories, setProductCategories] = useState<string[]>([])
  const [about, setAbout] = useState('')

  const toggleChannel = (channel: string, type: 'current' | 'target') => {
    if (type === 'current') {
      setCurrentChannels(prev =>
        prev.includes(channel)
          ? prev.filter(c => c !== channel)
          : [...prev, channel]
      )
    } else {
      setTargetChannels(prev =>
        prev.includes(channel)
          ? prev.filter(c => c !== channel)
          : [...prev, channel]
      )
    }
  }

  const toggleCategory = (category: string) => {
    setProductCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { error: insertError } = await supabase
        .from('brands')
        .insert({
          user_id: user.id,
          company_name: companyName,
          name: companyName,
          contact_name: contactName,
          contact_email: contactEmail || user.email,
          phone: phone || null,
          website: website || null,
          current_channels: currentChannels,
          target_channels: targetChannels,
          product_categories: productCategories,
          about: about || null,
          status: 'pending',
        })

      if (insertError) throw insertError

      router.push('/pending')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s
                    ? 'bg-shelfdrop-green text-black'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s}
              </div>
            ))}
          </div>
          <div className="h-1 bg-gray-200 rounded">
            <div
              className="h-1 bg-shelfdrop-green rounded transition-all"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Step 1: Company Info */}
          {step === 1 && (
            <>
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-shelfdrop-green/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-6 h-6 text-shelfdrop-blue" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Tell us about your brand</h1>
                <p className="text-gray-500 mt-1">Let's start with the basics</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
                    placeholder="Your brand name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Name *
                    </label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
                      placeholder="+44..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!companyName || !contactName}
                className="w-full mt-8 py-3 bg-shelfdrop-green text-black rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50"
              >
                Continue
              </button>
            </>
          )}

          {/* Step 2: Channels */}
          {step === 2 && (
            <>
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-shelfdrop-green/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-6 h-6 text-shelfdrop-blue" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Your sales channels</h1>
                <p className="text-gray-500 mt-1">Where do you sell today, and where do you want to go?</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Current Channels (where you sell now)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {channels.map((channel) => (
                      <button
                        key={channel}
                        type="button"
                        onClick={() => toggleChannel(channel, 'current')}
                        className={`px-4 py-2 rounded-full text-sm transition-colors ${
                          currentChannels.includes(channel)
                            ? 'bg-shelfdrop-green text-black'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {channel}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Target Channels (where you want to sell)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {channels.map((channel) => (
                      <button
                        key={channel}
                        type="button"
                        onClick={() => toggleChannel(channel, 'target')}
                        className={`px-4 py-2 rounded-full text-sm transition-colors ${
                          targetChannels.includes(channel)
                            ? 'bg-shelfdrop-green text-black'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {channel}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-shelfdrop-green text-black rounded-lg hover:bg-green-400 transition-colors"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {/* Step 3: Products */}
          {step === 3 && (
            <>
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-shelfdrop-green/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Package className="w-6 h-6 text-shelfdrop-blue" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Your products</h1>
                <p className="text-gray-500 mt-1">Tell us about what you make</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Product Categories
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => toggleCategory(category)}
                        className={`px-4 py-2 rounded-full text-sm transition-colors ${
                          productCategories.includes(category)
                            ? 'bg-shelfdrop-green text-black'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tell us more about your brand (optional)
                  </label>
                  <textarea
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
                    placeholder="Your brand story, product range, goals..."
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 bg-shelfdrop-green text-black rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
