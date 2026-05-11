import React, { useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Modal, ActivityIndicator, RefreshControl, Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFeed, interactWithPost, createDriftPost } from '../../src/api/feed'
import { formatTimeAgo, formatCountdown } from '../../src/utils/time'
import type { DriftPostWithDetails } from '../../src/types'

function DriftCard({ post, userId }: { post: DriftPostWithDetails; userId: string }) {
  const qc = useQueryClient()
  const [respondModal, setRespondModal] = useState(false)
  const [message, setMessage] = useState('')

  const likeMut = useMutation({
    mutationFn: () => interactWithPost(post.id, 'like'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  })
  const respondMut = useMutation({
    mutationFn: () => interactWithPost(post.id, 'respond', message),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['feed'] }); setRespondModal(false); setMessage('') },
    onError: (e: Error) => Alert.alert('Error', e.message),
  })

  const hasLiked = post.interactions.some((i) => i.userId === userId && i.type === 'like')
  const hasResponded = post.interactions.some((i) => i.userId === userId && i.type === 'respond')

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{post.user.name?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{post.user.name}</Text>
          <Text style={styles.meta}>
            {post.user.city ? `📍 ${post.user.city} · ` : ''}
            {formatTimeAgo(post.createdAt)}
          </Text>
        </View>
        {post.compatibilityScore != null && (
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{post.compatibilityScore}%</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <Text style={styles.content}>
        {post.emoji ? `${post.emoji}  ` : ''}{post.content}
      </Text>

      {/* Tags */}
      {(post.commonLikes?.length || post.commonHobbies?.length) ? (
        <View style={styles.tagsRow}>
          {[...(post.commonLikes ?? []), ...(post.commonHobbies ?? [])].slice(0, 3).map((t) => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.countdown}>⏳ {formatCountdown(post.expiresAt)}</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, hasLiked && styles.actionActive]}
            onPress={() => !hasLiked && !post.hasInteracted && likeMut.mutate()}
            disabled={hasLiked || post.hasInteracted || likeMut.isPending}
          >
            <Text style={styles.actionText}>❤️ Like</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.respondBtn, hasResponded && styles.actionActive]}
            onPress={() => !hasResponded && !post.hasInteracted && setRespondModal(true)}
            disabled={hasResponded || post.hasInteracted}
          >
            <Text style={styles.actionText}>💬 Respond</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Respond modal */}
      <Modal visible={respondModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send a message to {post.user.name}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Say something genuine..."
              placeholderTextColor="#9ca3af"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={280}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setRespondModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={() => respondMut.mutate()}
                disabled={!message.trim() || respondMut.isPending}
              >
                {respondMut.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.sendText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

export default function FeedScreen() {
  const qc = useQueryClient()
  const [createModal, setCreateModal] = useState(false)
  const [newPost, setNewPost] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['feed'],
    queryFn: getFeed,
  })

  const createMut = useMutation({
    mutationFn: () => createDriftPost({ content: newPost }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['feed'] }); setCreateModal(false); setNewPost('') },
    onError: (e: Error) => Alert.alert('Error', e.message),
  })

  // Get current user id from first post's interactions or from context
  const userId = ''

  return (
    <LinearGradient colors={['#1e0512', '#2d0a1a']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>drift</Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => setCreateModal(true)}>
            <Text style={styles.createBtnText}>+ Post</Text>
          </TouchableOpacity>
        </View>

        {/* Feed list */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#f472b6" size="large" />
          </View>
        ) : (
          <FlatList
            data={data?.posts ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <DriftCard post={item} userId={userId} />}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl onRefresh={refetch} refreshing={isLoading} tintColor="#f472b6" />
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyText}>No posts nearby. Be the first to drift! 🌊</Text>
              </View>
            }
          />
        )}

        {/* Create post modal */}
        <Modal visible={createModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>What&apos;s on your mind?</Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 100 }]}
                placeholder="Share something real... (expires in 24h)"
                placeholderTextColor="#9ca3af"
                value={newPost}
                onChangeText={setNewPost}
                multiline
                maxLength={280}
                autoFocus
              />
              <Text style={styles.charCount}>{newPost.length}/280</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreateModal(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sendBtn, !newPost.trim() && styles.disabledBtn]}
                  onPress={() => createMut.mutate()}
                  disabled={!newPost.trim() || createMut.isPending}
                >
                  {createMut.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.sendText}>Post</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#f9a8d4', letterSpacing: -1 },
  createBtn: {
    backgroundColor: 'rgba(244,114,182,0.2)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(244,114,182,0.3)',
  },
  createBtnText: { color: '#f472b6', fontWeight: '700', fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: 15 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: 'rgba(244,114,182,0.1)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(244,114,182,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#f9a8d4', fontWeight: '700', fontSize: 16 },
  userName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  meta: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
  scoreBadge: {
    backgroundColor: 'rgba(244,114,182,0.2)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(244,114,182,0.3)',
  },
  scoreText: { color: '#f472b6', fontWeight: '700', fontSize: 13 },
  content: { color: '#fff', fontSize: 16, lineHeight: 24, marginBottom: 12 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag: {
    backgroundColor: 'rgba(244,114,182,0.15)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  tagText: { color: '#f9a8d4', fontSize: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countdown: { color: 'rgba(255,255,255,0.3)', fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  respondBtn: { borderColor: 'rgba(244,114,182,0.2)' },
  actionActive: { backgroundColor: 'rgba(244,114,182,0.2)', borderColor: 'rgba(244,114,182,0.4)' },
  actionText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e0512', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, borderTopWidth: 1, borderColor: 'rgba(244,114,182,0.2)',
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#fff',
    borderWidth: 1, borderColor: 'rgba(244,114,182,0.15)', textAlignVertical: 'top',
  },
  charCount: { color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'right', marginTop: 4 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 12 },
  cancelText: { color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: 15 },
  sendBtn: {
    backgroundColor: '#ec4899', borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  sendText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  disabledBtn: { opacity: 0.4 },
})
