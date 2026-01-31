'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Send, Loader2 } from 'lucide-react'

interface Message {
  id: string
  sender_type: string
  sender_name: string | null
  message: string
  created_at: string
}

interface ChatViewProps {
  channelId: string
  brandName: string
  messages: Message[]
}

export default function ChatView({ channelId, brandName, messages: initialMessages }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelId, supabase])

  const handleSend = async () => {
    if (!newMessage.trim()) return

    setSending(true)

    try {
      const { error } = await supabase
        .from('support_messages')
        .insert({
          channel_id: channelId,
          sender_type: 'brand',
          sender_name: brandName,
          message: newMessage.trim(),
        })

      if (error) throw error

      setNewMessage('')
      router.refresh()
    } catch (error: any) {
      alert(`Failed to send: ${error.message}`)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    }
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = []
  let currentDate = ''

  messages.forEach((message) => {
    const messageDate = new Date(message.created_at).toDateString()
    if (messageDate !== currentDate) {
      currentDate = messageDate
      groupedMessages.push({ date: message.created_at, messages: [message] })
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(message)
    }
  })

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-6">
        {groupedMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            No messages yet. Start the conversation below.
          </div>
        ) : (
          groupedMessages.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Date divider */}
              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-500 font-medium">
                  {formatDate(group.date)}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Messages for this date */}
              <div className="space-y-3">
                {group.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_type === 'brand' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        message.sender_type === 'brand'
                          ? 'bg-shelfdrop-green text-black'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.sender_type === 'admin' && (
                        <p className="text-xs font-medium text-shelfdrop-blue mb-1">
                          Shelfdrop
                        </p>
                      )}
                      <p className="whitespace-pre-wrap">{message.message}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender_type === 'brand'
                            ? 'text-white/70'
                            : 'text-gray-500'
                        }`}
                      >
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-end gap-3">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="p-3 bg-shelfdrop-green text-black rounded-xl hover:bg-green-400 disabled:opacity-50 transition-colors"
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
