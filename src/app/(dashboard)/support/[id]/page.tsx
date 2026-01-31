export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import ChatView from './ChatView'

export default async function ConversationPage({
  params
}: {
  params: { id: string }
}) {
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

  // Get channel
  const { data: channel } = await supabase
    .from('support_channels')
    .select('id, name, channel_type, brand_id')
    .eq('id', params.id)
    .eq('brand_id', brand.id)
    .single()

  if (!channel) {
    redirect('/support')
  }

  // Get messages
  const { data: messages } = await supabase
    .from('support_messages')
    .select('*')
    .eq('channel_id', channel.id)
    .order('created_at', { ascending: true })

  // Mark messages as read
  await supabase
    .from('support_messages')
    .update({ is_read: true })
    .eq('channel_id', channel.id)
    .eq('sender_type', 'admin')
    .eq('is_read', false)

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
        <Link
          href="/support"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            # {channel.name}
          </h1>
          <p className="text-sm text-gray-500">
            Chat with Shelfdrop
          </p>
        </div>
      </div>

      {/* Chat */}
      <ChatView
        channelId={channel.id}
        brandName={brand.company_name || 'Brand'}
        messages={messages || []}
      />
    </div>
  )
}
