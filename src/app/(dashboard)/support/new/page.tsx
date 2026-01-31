'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, MessageSquare, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const channelTypes = [
  { value: 'general', label: 'General', description: 'General questions and support' },
  { value: 'orders', label: 'Orders', description: 'Questions about purchase orders' },
  { value: 'products', label: 'Products', description: 'Product listings and approvals' },
  { value: 'billing', label: 'Billing', description: 'Invoices and payments' },
  { value: 'promotions', label: 'Promotions', description: 'Promotional campaigns' },
  { value: 'other', label: 'Other', description: 'Anything else' },
]

export default function NewConversationPage() {
  const [loading, setLoading] = useState(false)
  const [brandId, setBrandId] = useState('')
  const [name, setName] = useState('')
  const [channelType, setChannelType] = useState('general')
  const [firstMessage, setFirstMessage] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadBrand()
  }, [])

  const loadBrand = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: brand } = await supabase
      .from('brands')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (brand) {
      setBrandId(brand.id)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !firstMessage) {
      alert('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      // Create channel
      const { data: channel, error: channelError } = await supabase
        .from('support_channels')
        .insert({
          brand_id: brandId,
          name,
          channel_type: channelType,
        })
        .select()
        .single()

      if (channelError) throw channelError

      // Send first message
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          channel_id: channel.id,
          sender_type: 'brand',
          message: firstMessage,
        })

      if (messageError) throw messageError

      router.push(`/support/${channel.id}`)
    } catch (error: any) {
      alert(`Failed to create conversation: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl">
      <Link
        href="/support"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Support
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Conversation</h1>
        <p className="text-gray-600 mt-1">
          Start a new conversation with Shelfdrop
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Question about my latest order"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {channelTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setChannelType(type.value)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    channelType === type.value
                      ? 'border-shelfdrop-green bg-shelfdrop-green/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className={`font-medium ${
                    channelType === type.value ? 'text-shelfdrop-blue' : 'text-gray-900'
                  }`}>
                    {type.label}
                  </p>
                  <p className="text-xs text-gray-500">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message *
            </label>
            <textarea
              value={firstMessage}
              onChange={(e) => setFirstMessage(e.target.value)}
              required
              rows={4}
              placeholder="Describe what you need help with..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/support"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-shelfdrop-green text-black rounded-lg hover:bg-green-400 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4" />
                Start Conversation
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
