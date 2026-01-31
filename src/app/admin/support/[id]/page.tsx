export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft, Building2 } from 'lucide-react'
import Link from 'next/link'
import AdminChatView from './AdminChatView'

export default async function AdminSupportConversationPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'george@shelfdrop.com') {
    redirect('/auth/login')
  }

  // Get channel info with brand
  const { data: channel } = await supabase
    .from('support_channels')
    .select('*, brands(id, company_name, name)')
    .eq('id', params.id)
    .single()

  if (!channel) {
    redirect('/admin/support')
  }

  // Get messages
  const { data: messages } = await supabase
    .from('support_messages')
    .select('*')
    .eq('channel_id', params.id)
    .order('created_at', { ascending: true })

  // Mark brand messages as read
  await supabase
    .from('support_messages')
    .update({ is_read: true })
    .eq('channel_id', params.id)
    .eq('sender_type', 'brand')

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <Link
          href="/admin/support"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="font-semibold text-gray-900 flex items-center gap-2">
            # {channel.name}
          </h1>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            {channel.brands?.company_name || channel.brands?.name || 'Unknown Brand'}
          </p>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <AdminChatView
          channelId={params.id}
          brandName={channel.brands?.company_name || channel.brands?.name || 'Brand'}
          initialMessages={messages || []}
          userId={user.id}
        />
      </div>
    </div>
  )
}
