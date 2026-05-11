'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ArrowLeft, Send, Clock, Zap, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { MessageBubble } from './MessageBubble'
import { useSocket } from '@/hooks/useSocket'
import { formatCountdown, cn } from '@/lib/utils'
import type { MatchWithDetails, MessageWithSender } from '@/types'

interface ChatWindowProps {
  matchId: string
}

async function fetchMatch(matchId: string): Promise<MatchWithDetails> {
  const res = await fetch(`/api/matches/${matchId}`)
  if (!res.ok) throw new Error('Match not found')
  const data = await res.json()
  return data.match
}

async function fetchMessages(matchId: string): Promise<MessageWithSender[]> {
  const res = await fetch(`/api/messages/${matchId}`)
  if (!res.ok) throw new Error('Failed to load messages')
  const data = await res.json()
  return data.messages
}

export default function ChatWindow({ matchId }: ChatWindowProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const { socket } = useSocket()

  const { data: match, isError: matchError } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => fetchMatch(matchId),
  })

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', matchId],
    queryFn: () => fetchMessages(matchId),
    refetchInterval: 5000, // poll every 5s as fallback
  })

  // Socket setup
  useEffect(() => {
    if (!socket || !session?.user.id) return

    socket.emit('join-match', matchId)

    socket.on('new-message', (msg: MessageWithSender) => {
      queryClient.setQueryData<MessageWithSender[]>(['messages', matchId], (old = []) => {
        if (old.some((m) => m.id === msg.id)) return old
        return [...old, msg]
      })
    })

    socket.on('user-typing', () => setOtherUserTyping(true))
    socket.on('user-stop-typing', () => setOtherUserTyping(false))
    socket.on('match-expired', () => {
      toast.error('This match has expired.')
      void router.push('/matches')
    })
    return () => {
      socket.emit('leave-match', matchId)
      socket.off('new-message')
      socket.off('user-typing')
      socket.off('user-stop-typing')
      socket.off('match-expired')
    }
  }, [socket, matchId, session?.user.id, queryClient, router])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, otherUserTyping])

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/messages/${matchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to send message')
      }
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.setQueryData<MessageWithSender[]>(['messages', matchId], (old = []) => {
        if (old.some((m) => m.id === data.message.id)) return old
        return [...old, data.message]
      })
      // The API route already calls emitNewMessage() server-side, which broadcasts
      // the new-message socket event to everyone in the match room (including the
      // sender). No need to emit again from the client.
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const stopTypingFn = useCallback(() => {
    setIsTyping(false)
    socket?.emit('stop-typing', { matchId, userId: session?.user.id })
    clearTimeout(typingTimeoutRef.current)
  }, [socket, matchId, session?.user.id])

  const emitTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true)
      socket?.emit('typing', { matchId, userId: session?.user.id, userName: session?.user.name })
    }
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(stopTypingFn, 2000)
  }, [socket, matchId, session, isTyping, stopTypingFn])

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || sendMutation.isPending) return
    setInput('')
    stopTypingFn()
    sendMutation.mutate(trimmed)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, sendMutation.isPending, stopTypingFn])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  if (matchError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <AlertTriangle className="text-muted-foreground" size={32} />
        <p className="text-muted-foreground">Match not found or has expired.</p>
        <Link href="/matches">
          <Button variant="outline" size="sm">Back to Matches</Button>
        </Link>
      </div>
    )
  }

  const otherUser = match
    ? match.userAId === session?.user.id
      ? match.userB
      : match.userA
    : null

  const isExpiringSoon = match
    ? new Date(match.expiresAt) < new Date(Date.now() + 2 * 60 * 60 * 1000)
    : false

  return (
    <div className="flex flex-col h-[calc(100vh-64px-80px)] sm:h-[calc(100vh-64px-20px)] -mt-4 sm:mt-0">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 p-4 border-b border-border/50 bg-background/80 backdrop-blur sticky top-16 z-10">
        <Link href="/matches" className="p-1.5 rounded-lg hover:bg-rose-50 text-muted-foreground hover:text-gray-900 transition-colors">
          <ArrowLeft size={18} />
        </Link>

        {otherUser && (
          <>
            <Avatar src={otherUser.avatar} name={otherUser.name} size="sm" online />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{otherUser.name}</p>
              <div className="flex items-center gap-2">
                {match && (
                  <Badge variant={isExpiringSoon ? 'danger' : 'time'}>
                    <Clock size={9} />
                    {formatCountdown(match.expiresAt)}
                  </Badge>
                )}
                {match && (
                  <Badge variant="score">
                    <Zap size={9} />
                    {match.score}
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Compatibility banner */}
      {match && (match.commonLikes.length > 0 || match.commonDislikes.length > 0) && (
        <div className="flex-shrink-0 px-4 py-2 bg-primary/5 border-b border-border/30">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs text-muted-foreground whitespace-nowrap">You both:</span>
            {match.commonLikes.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="like">❤ {tag}</Badge>
            ))}
            {match.commonDislikes.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="dislike">✕ {tag}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.length === 0 && (
          <div className="text-center pt-8">
            <p className="text-2xl mb-2">👋</p>
            <p className="text-sm text-muted-foreground">
              You matched! Say hi before the 24h window closes.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === session?.user.id}
            showAvatar={
              i === 0 ||
              messages[i - 1]?.senderId !== msg.senderId
            }
          />
        ))}
        {otherUserTyping && (
          <div className="flex items-center gap-2">
            <Avatar src={otherUser?.avatar} name={otherUser?.name ?? '?'} size="xs" />
            <div className="px-3 py-2 rounded-2xl rounded-bl-sm bg-card border border-border">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-border/50 bg-background/80 backdrop-blur">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              void emitTyping()
            }}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            rows={1}
            className={cn(
              'flex-1 resize-none bg-surface border border-border rounded-2xl px-4 py-3',
              'text-sm text-gray-900 placeholder:text-muted-foreground/50 outline-none',
              'focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all',
              'max-h-32 overflow-y-auto'
            )}
            style={{ minHeight: '44px' }}
          />
          <Button
            size="icon"
            onClick={handleSend}
            loading={sendMutation.isPending}
            disabled={!input.trim()}
            className="rounded-full h-11 w-11 flex-shrink-0"
          >
            <Send size={16} />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
