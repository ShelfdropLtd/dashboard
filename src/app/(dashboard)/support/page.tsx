export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessageSquare, Plus } from 'lucide-react'
import Link from 'next/link'
import ChannelList from './ChannelList'

export default async function BrandSupportPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get brand
  const { data: brand } = await supabase
    .from('brands')
    .select('id, company_name')
    .eq('user_id', user.id)
    .single()

  if (!brand) {
    redirect('/onboarding')
  }

  // Get channels for this brand
  const { data: channels } = await supabase
    .from('support_channels')
    .select(`
      id,
      name,
      channel_type,
      created_at,
      support_messages(id, message, sender_type, is_read, created_at)
    `)
    .eq('brand_id', brand.id)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })

  // Process channels to get unread counts and last message
  const processedChannels = channels?.map((channel: any) => {
    const messages = channel.support_messages || []
    const unreadCount = messages.filter((m: any) => m.sender_type === 'admin' && !m.is_read).length
    const lastMessage = messages.sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0]

    return {
      id: channel.id,
      name: channel.name,
      channel_type: channel.channel_type,
      unread_count: unreadCount,
      last_message: lastMessage?.message,
      last_message_at: lastMessage?.created_at,
      last_message_from: lastMessage?.sender_type,
    }
  }) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support</h1>
          <p className="text-gray-600 mt-1">Chat with Shelfdrop about your orders, products, and more</p>
        </div>
        <Link
          href="/support/new"
          className="px-4 py-2 bg-shelfdrop-green text-black rounded-lg hover:bg-green-400 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Conversation
        </Link>
      </div>

      {processedChannels.length > 0 ? (
        <ChannelList channels={processedChannels} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">No Conversations Yet</h2>
          <p className="text-gray-500 mb-4">
            Start a conversation with Shelfdrop about anything you need help with.
          </p>
          <Link
            href="/support/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-shelfdrop-green text-black rounded-lg hover:bg-green-400"
          >
            <Plus className="w-4 h-4" />
            Start Conversation
          </Link>
        </div>
      )}
    </div>
  )
}
