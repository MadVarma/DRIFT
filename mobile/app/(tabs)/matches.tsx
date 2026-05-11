import React from 'react'
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { getMatches } from '../../src/api/matches'
import { formatTimeAgo, formatCountdown } from '../../src/utils/time'
import { useAuth } from '../../src/context/AuthContext'
import type { MatchWithDetails } from '../../src/types'

function MatchItem({ match, currentUserId }: { match: MatchWithDetails; currentUserId: string }) {
  const router = useRouter()
  const other = match.userA.id === currentUserId ? match.userB : match.userA

  return (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() => router.push(`/chat/${match.id}`)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{other.name?.[0]?.toUpperCase() ?? '?'}</Text>
      </View>
      <View style={styles.matchInfo}>
        <View style={styles.matchRow}>
          <Text style={styles.matchName}>{other.name}</Text>
          {match.lastMessage && (
            <Text style={styles.lastTime}>{formatTimeAgo(match.lastMessage.createdAt)}</Text>
          )}
        </View>
        {other.city && <Text style={styles.matchCity}>📍 {other.city}</Text>}
        {match.lastMessage ? (
          <Text style={styles.lastMsg} numberOfLines={1}>
            {match.lastMessage.content}
          </Text>
        ) : (
          <Text style={styles.noMsg}>Say hello! 👋</Text>
        )}
      </View>
      <View style={styles.countdown}>
        <Text style={styles.countdownText}>⏳ {formatCountdown(match.expiresAt)}</Text>
      </View>
    </TouchableOpacity>
  )
}

export default function MatchesScreen() {
  const { user } = useAuth()
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['matches'],
    queryFn: getMatches,
  })

  return (
    <LinearGradient colors={['#1e0512', '#2d0a1a']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Matches</Text>
          <Text style={styles.headerSub}>{data?.matches?.length ?? 0} active</Text>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#f472b6" size="large" />
          </View>
        ) : (
          <FlatList
            data={data?.matches ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MatchItem match={item} currentUserId={user?.id ?? ''} />
            )}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl onRefresh={refetch} refreshing={isLoading} tintColor="#f472b6" />
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyIcon}>💔</Text>
                <Text style={styles.emptyTitle}>No matches yet</Text>
                <Text style={styles.emptyText}>
                  Like or respond to posts in the feed to match with people!
                </Text>
              </View>
            }
          />
        )}
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
  headerSub: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyText: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: 14, lineHeight: 20 },
  matchCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: 'rgba(244,114,182,0.1)',
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(244,114,182,0.25)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(244,114,182,0.4)',
  },
  avatarText: { color: '#f9a8d4', fontWeight: '800', fontSize: 18 },
  matchInfo: { flex: 1 },
  matchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matchName: { color: '#fff', fontWeight: '700', fontSize: 16 },
  lastTime: { color: 'rgba(255,255,255,0.3)', fontSize: 12 },
  matchCity: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 },
  lastMsg: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 3 },
  noMsg: { color: 'rgba(244,114,182,0.5)', fontSize: 13, marginTop: 3, fontStyle: 'italic' },
  countdown: { alignItems: 'flex-end' },
  countdownText: { color: 'rgba(255,255,255,0.25)', fontSize: 11 },
})
