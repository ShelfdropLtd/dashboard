'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Loader2 } from 'lucide-react'

interface Message {
  id: string
  message: string
  sender_type: 'brand' | 'admin'
  sender_id: string
  created_at: string
  is_read: boolean
}

interface AdminChatViewProps {
  channelId: string
  brandName: string
  initialMessages: Message[]
  userId: string
}

export default function AdminChatView({
  channelId,
  brandName,
  initialMessages,
  userId,
}: AdminChatViewProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`support-admin-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => {
            // Check if message already exists
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelId, supabase])

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .insert({
          channel_id: channelId,
          sender_id: userId,
          sender_type: 'admin',
          message: newMessage.trim(),
        })
        .select()
        .single()

      if (error) throw error

      // Update channel's updated_at
      await supabase
        .from('support_channels')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', channelId)

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    const time = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })

    if (days === 0) {
      return `Today at ${time}`
    } else if (days === 1) {
      return `Yesterday at ${time}`
    } else {
      return `${date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      })} at ${time}`
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_type === 'admin' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] ${
                  message.sender_type === 'admin'
                    ? 'bg-shelfdrop-green text-black'
                    : 'bg-white border border-gray-200'
                } rounded-2xl px-4 py-3`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-medium ${
                      message.sender_type === 'admin'
                        ? 'text-white/80'
                        : 'text-gray-500'
                    }`}
                  >
                    {message.sender_type === 'admin' ? 'You' : brandName}
                  </span>
                  <span
                    className={`text-xs ${
                      message.sender_type === 'admin'
                        ? 'text-white/60'
                        : 'text-gray-400'
                    }`}
                  >
                    {formatTime(message.created_at)}
                  </span>
                </div>
                <p
                  className={`text-sm ${
                    message.sender_type === 'admin' ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {message.message}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="p-3 bg-shelfdrop-green text-black rounded-xl hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
