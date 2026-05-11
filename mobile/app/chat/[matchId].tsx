import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { io, Socket } from 'socket.io-client'
import { getMessages, sendMessage, getMatches } from '../../src/api/matches'
import { getSessionToken, API_BASE_URL } from '../../src/api/client'
import { formatTimeIST } from '../../src/utils/time'
import { useAuth } from '../../src/context/AuthContext'
import type { MessageWithSender } from '../../src/types'

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const qc = useQueryClient()
  const flatListRef = useRef<FlatList>(null)
  const socketRef = useRef<Socket | null>(null)
  const [messageText, setMessageText] = useState('')
  const [socketMessages, setSocketMessages] = useState<MessageWithSender[]>([])

  // Fetch messages
  const { data, isLoading } = useQuery({
    queryKey: ['messages', matchId],
    queryFn: () => getMessages(matchId),
    enabled: !!matchId,
  })

  // Get match details for the other user's name
  const { data: matchesData } = useQuery({
    queryKey: ['matches'],
    queryFn: getMatches,
  })
  const match = matchesData?.matches?.find((m) => m.id === matchId)
  const otherUser = match
    ? match.userA.id === user?.id ? match.userB : match.userA
    : null

  // Socket connection
  useEffect(() => {
    let socket: Socket

    async function connectSocket() {
      const token = await getSessionToken()
      socket = io(API_BASE_URL, {
        path: '/api/socketio',
        transports: ['polling'],
        auth: { token },
      })

      socket.on('connect', () => {
        socket.emit('join-match', matchId)
        if (user?.id) socket.emit('join-user-room', user.id)
      })

      socket.on('new-message', (msg: MessageWithSender) => {
        if (msg.matchId === matchId) {
          setSocketMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        }
      })

      socketRef.current = socket
    }

    void connectSocket()

    return () => {
      socket?.disconnect()
    }
  }, [matchId, user?.id])

  // Merge DB messages and socket messages
  const allMessages = React.useMemo(() => {
    const dbMsgs = data?.messages ?? []
    const merged = [...dbMsgs]
    for (const sm of socketMessages) {
      if (!merged.some((m) => m.id === sm.id)) merged.push(sm)
    }
    return merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [data?.messages, socketMessages])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (allMessages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [allMessages.length])

  const sendMut = useMutation({
    mutationFn: (content: string) => sendMessage(matchId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', matchId] })
      setMessageText('')
    },
  })

  const handleSend = useCallback(() => {
    const trimmed = messageText.trim()
    if (!trimmed) return
    sendMut.mutate(trimmed)
  }, [messageText, sendMut])

  function renderMessage({ item }: { item: MessageWithSender }) {
    const isMe = item.senderId === user?.id
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRight : styles.msgLeft]}>
        {!isMe && (
          <View style={styles.msgAvatar}>
            <Text style={styles.msgAvatarText}>{item.sender?.name?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={styles.bubbleText}>{item.content}</Text>
          <Text style={styles.bubbleTime}>{formatTimeIST(item.createdAt)}</Text>
        </View>
      </View>
    )
  }

  return (
    <LinearGradient colors={['#1e0512', '#2d0a1a']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{otherUser?.name ?? 'Chat'}</Text>
            {otherUser?.city && <Text style={styles.headerCity}>📍 {otherUser.city}</Text>}
          </View>
        </View>

        {/* Messages */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color="#f472b6" size="large" />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={allMessages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              ListEmptyComponent={
                <View style={styles.center}>
                  <Text style={styles.emptyText}>No messages yet. Say hello! 👋</Text>
                </View>
              }
            />
          )}

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#9ca3af"
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !messageText.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!messageText.trim() || sendMut.isPending}
            >
              {sendMut.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.sendIcon}>➤</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(244,114,182,0.1)',
  },
  backBtn: { padding: 8, marginRight: 8 },
  backText: { color: '#f472b6', fontSize: 32, lineHeight: 32 },
  headerInfo: { flex: 1 },
  headerName: { color: '#fff', fontWeight: '700', fontSize: 18 },
  headerCity: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messagesList: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 8 },
  emptyText: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: 15 },
  msgRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-end', gap: 8 },
  msgLeft: { justifyContent: 'flex-start' },
  msgRight: { justifyContent: 'flex-end' },
  msgAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(244,114,182,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  msgAvatarText: { color: '#f9a8d4', fontWeight: '700', fontSize: 11 },
  bubble: {
    maxWidth: '72%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleMe: { backgroundColor: 'rgba(236,72,153,0.85)', borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: 'rgba(255,255,255,0.1)', borderBottomLeftRadius: 4 },
  bubbleText: { color: '#fff', fontSize: 15, lineHeight: 21 },
  bubbleTime: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 4, textAlign: 'right' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(244,114,182,0.1)', gap: 10,
  },
  textInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#fff',
    borderWidth: 1, borderColor: 'rgba(244,114,182,0.2)', maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#ec4899', alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: 'rgba(236,72,153,0.3)' },
  sendIcon: { color: '#fff', fontSize: 18 },
})
