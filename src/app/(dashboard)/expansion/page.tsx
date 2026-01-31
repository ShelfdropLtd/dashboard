export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Globe,
  Store,
  ShoppingCart,
  Building2,
  Plane,
  ChevronRight,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react'
import ExpansionInterestForm from './ExpansionInterestForm'

const CHANNELS = [
  {
    id: 'amazon_uk',
    name: 'Amazon UK',
    icon: ShoppingCart,
    description: 'Reach millions of UK customers through Amazon Marketplace',
    status: 'active',
    marketSize: '£100M+ drinks category',
  },
  {
    id: 'shopify_d2c',
    name: 'D2C Website',
    icon: Store,
    description: 'Sell directly to consumers through your branded webshop',
    status: 'active',
    marketSize: 'Growing 20% YoY',
  },
  {
    id: 'tesco_marketplace',
    name: 'Tesco Marketplace',
    icon: Building2,
    description: 'Access Tesco\'s online grocery customers',
    status: 'coming_soon',
    marketSize: 'UK\'s largest grocer',
  },
  {
    id: 'ocado',
    name: 'Ocado',
    icon: ShoppingCart,
    description: 'Premium online grocery with affluent customer base',
    status: 'available',
    marketSize: '£2.5B revenue',
  },
  {
    id: 'trade_wholesale',
    name: 'Trade & Wholesale',
    icon: Building2,
    description: 'Bars, restaurants, hotels and independent retailers',
    status: 'available',
    marketSize: 'UK hospitality sector',
  },
  {
    id: 'amazon_eu',
    name: 'Amazon EU',
    icon: Globe,
    description: 'Expand to Germany, France, Italy, Spain markets',
    status: 'coming_soon',
    marketSize: '€500M+ opportunity',
  },
  {
    id: 'amazon_us',
    name: 'Amazon US',
    icon: Plane,
    description: 'Enter the world\'s largest e-commerce market',
    status: 'coming_soon',
    marketSize: '$50B+ drinks category',
  },
]

const MARKETS = [
  { id: 'uk', name: 'United Kingdom', flag: '🇬🇧', status: 'active' },
  { id: 'eu', name: 'European Union', flag: '🇪🇺', status: 'coming_soon' },
  { id: 'us', name: 'United States', flag: '🇺🇸', status: 'coming_soon' },
  { id: 'uae', name: 'UAE', flag: '🇦🇪', status: 'coming_soon' },
  { id: 'aus', name: 'Australia', flag: '🇦🇺', status: 'coming_soon' },
]

export default async function ExpansionPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user's brand
  const { data: brand } = await supabase
    .from('brands')
    .select('id, company_name, name')
    .eq('user_id', user.id)
    .single()

  if (!brand) {
    redirect('/onboarding')
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-shelfdrop-blue">Market Expansion</h1>
        <p className="text-gray-600">Explore new channels and markets for your brand</p>
      </div>

      {/* Current Status */}
      <div className="bg-gradient-to-r from-shelfdrop-green/20 to-shelfdrop-yellow/20 rounded-xl border border-shelfdrop-green p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-shelfdrop-green rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-black" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Active on UK Channels</h2>
            <p className="text-gray-600">Your brand is set up for UK distribution through Shelfdrop</p>
          </div>
        </div>
      </div>

      {/* Channels Grid */}
      <div className="mb-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Channels</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CHANNELS.map((channel) => (
            <div
              key={channel.id}
              className={`bg-white rounded-xl border p-6 transition-all ${
                channel.status === 'active'
                  ? 'border-green-200 bg-green-50/50'
                  : channel.status === 'available'
                  ? 'border-gray-200 hover:border-shelfdrop-green hover:shadow-md cursor-pointer'
                  : 'border-gray-200 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <channel.icon className="w-6 h-6 text-gray-700" />
                </div>
                {channel.status === 'active' && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Active
                  </span>
                )}
                {channel.status === 'available' && (
                  <span className="px-2 py-1 bg-shelfdrop-green text-black text-xs font-medium rounded-full">
                    Available
                  </span>
                )}
                {channel.status === 'coming_soon' && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Coming Soon
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{channel.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{channel.description}</p>
              <p className="text-xs text-shelfdrop-blue font-medium">{channel.marketSize}</p>

              {channel.status === 'available' && (
                <button className="mt-4 w-full py-2 bg-shelfdrop-green text-black font-medium rounded-lg hover:bg-green-400 transition-colors flex items-center justify-center gap-2">
                  Register Interest
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* International Markets */}
      <div className="mb-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">International Markets</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {MARKETS.map((market) => (
              <div
                key={market.id}
                className={`flex items-center justify-between p-4 ${
                  market.status === 'active' ? 'bg-green-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{market.flag}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{market.name}</h3>
                    <p className="text-sm text-gray-500">
                      {market.status === 'active'
                        ? 'Currently available'
                        : 'Register interest for updates'}
                    </p>
                  </div>
                </div>
                {market.status === 'active' ? (
                  <span className="px-3 py-1.5 bg-green-100 text-green-800 text-sm font-medium rounded-full flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Active
                  </span>
                ) : (
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors">
                    Register Interest
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Expansion Assessment */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">AI Expansion Readiness</h2>
            <p className="text-gray-600">Get personalized recommendations for market expansion</p>
          </div>
        </div>

        <ExpansionInterestForm brandId={brand.id} />
      </div>
    </div>
  )
}
