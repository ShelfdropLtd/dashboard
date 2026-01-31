'use client'

import Link from 'next/link'
import { MessageSquare, ShoppingCart, Package, CreditCard, Megaphone, HelpCircle } from 'lucide-react'

interface Channel {
  id: string
  name: string
  channel_type: string
  unread_count: number
  last_message: string | null
  last_message_at: string | null
  last_message_from: string | null
}

const channelIcons: Record<string, any> = {
  general: MessageSquare,
  orders: ShoppingCart,
  products: Package,
  billing: CreditCard,
  promotions: Megaphone,
  other: HelpCircle,
}

export default function ChannelList({ channels }: { channels: Channel[] }) {
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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="divide-y divide-gray-200">
        {channels.map((channel) => {
          const Icon = channelIcons[channel.channel_type] || MessageSquare

          return (
            <Link
              key={channel.id}
              href={`/support/${channel.id}`}
              className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                channel.unread_count > 0 ? 'bg-shelfdrop-green/10' : 'bg-gray-100'
              }`}>
                <Icon className={`w-5 h-5 ${
                  channel.unread_count > 0 ? 'text-shelfdrop-blue' : 'text-gray-400'
                }`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className={`font-medium ${
                    channel.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    # {channel.name}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {formatTime(channel.last_message_at)}
                  </span>
                </div>
                {channel.last_message && (
                  <p className="text-sm text-gray-500 truncate mt-0.5">
                    {channel.last_message_from === 'admin' && (
                      <span className="text-shelfdrop-blue">Shelfdrop: </span>
                    )}
                    {channel.last_message}
                  </p>
                )}
              </div>

              {channel.unread_count > 0 && (
                <div className="w-5 h-5 bg-shelfdrop-green rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {channel.unread_count}
                  </span>
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
