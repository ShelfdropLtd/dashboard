export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessageSquare, Building2 } from 'lucide-react'
import Link from 'next/link'

export default async function AdminSupportPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'george@shelfdrop.com') {
    redirect('/auth/login')
  }

  // Get all channels with brand info and message counts
  const { data: channels } = await supabase
    .from('support_channels')
    .select(`
      id,
      name,
      channel_type,
      created_at,
      brands(id, company_name, name),
      support_messages(id, message, sender_type, is_read, created_at)
    `)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })

  // Process channels
  const processedChannels = channels?.map((channel: any) => {
    const messages = channel.support_messages || []
    const unreadCount = messages.filter((m: any) => m.sender_type === 'brand' && !m.is_read).length
    const lastMessage = messages.sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0]

    return {
      id: channel.id,
      name: channel.name,
      channel_type: channel.channel_type,
      brand_name: channel.brands?.company_name || channel.brands?.name || 'Unknown',
      brand_id: channel.brands?.id,
      unread_count: unreadCount,
      last_message: lastMessage?.message,
      last_message_at: lastMessage?.created_at,
      last_message_from: lastMessage?.sender_type,
    }
  }) || []

  const totalUnread = processedChannels.reduce((sum, ch) => sum + ch.unread_count, 0)

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return date.toLocaleDateString('en-GB', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support Messages</h1>
        <p className="text-gray-600 mt-1">
          {totalUnread > 0 ? (
            <span className="text-shelfdrop-blue font-medium">{totalUnread} unread messages</span>
          ) : (
            'All caught up!'
          )}
        </p>
      </div>

      {processedChannels.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {processedChannels.map((channel) => (
              <Link
                key={channel.id}
                href={`/admin/support/${channel.id}`}
                className={`p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors ${
                  channel.unread_count > 0 ? 'bg-orange-50/50' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  channel.unread_count > 0 ? 'bg-shelfdrop-green/10' : 'bg-gray-100'
                }`}>
                  <MessageSquare className={`w-5 h-5 ${
                    channel.unread_count > 0 ? 'text-shelfdrop-blue' : 'text-gray-400'
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-medium ${
                      channel.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      # {channel.name}
                    </h3>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {channel.brand_name}
                    </span>
                  </div>
                  {channel.last_message && (
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {channel.last_message_from === 'brand' && (
                        <span className="font-medium">{channel.brand_name}: </span>
                      )}
                      {channel.last_message_from === 'admin' && (
                        <span className="text-shelfdrop-blue">You: </span>
                      )}
                      {channel.last_message}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">
                    {formatTime(channel.last_message_at)}
                  </span>
                  {channel.unread_count > 0 && (
                    <div className="w-5 h-5 bg-shelfdrop-green rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {channel.unread_count}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">No Conversations Yet</h2>
          <p className="text-gray-500">
            Brands will start conversations here when they need support.
          </p>
        </div>
      )}
    </div>
  )
}
