import React from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../src/context/AuthContext'

export default function ProfileScreen() {
  const { user, signOut } = useAuth()

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => { await signOut() },
      },
    ])
  }

  if (!user) {
    return (
      <LinearGradient colors={['#1e0512', '#2d0a1a']} style={{ flex: 1 }}>
        <View style={styles.center}>
          <ActivityIndicator color="#f472b6" size="large" />
        </View>
      </LinearGradient>
    )
  }

  const prefs = user.preferences

  return (
    <LinearGradient colors={['#1e0512', '#2d0a1a']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Avatar + name */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarText}>{user.name?.[0]?.toUpperCase() ?? '?'}</Text>
            </View>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
            {user.city && <Text style={styles.city}>📍 {user.city}</Text>}
          </View>

          {/* Bio */}
          {user.bio && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bioText}>{user.bio}</Text>
            </View>
          )}

          {/* Preferences */}
          {prefs && (
            <>
              {prefs.hobbies?.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Hobbies</Text>
                  <View style={styles.tagsRow}>
                    {prefs.hobbies.map((h) => (
                      <View key={h} style={styles.tag}>
                        <Text style={styles.tagText}>{h}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {prefs.interests?.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Interests</Text>
                  <View style={styles.tagsRow}>
                    {prefs.interests.map((i) => (
                      <View key={i} style={[styles.tag, styles.interestTag]}>
                        <Text style={styles.tagText}>{i}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {prefs.likes?.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>❤️ Likes</Text>
                  <View style={styles.tagsRow}>
                    {prefs.likes.map((l) => (
                      <View key={l} style={[styles.tag, styles.likeTag]}>
                        <Text style={styles.tagText}>{l}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {prefs.dislikes?.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>💔 Dislikes</Text>
                  <View style={styles.tagsRow}>
                    {prefs.dislikes.map((d) => (
                      <View key={d} style={[styles.tag, styles.dislikeTag]}>
                        <Text style={styles.tagText}>{d}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}

          {/* Sign out */}
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileHeader: { alignItems: 'center', paddingVertical: 32 },
  avatarLarge: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(244,114,182,0.3)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(244,114,182,0.5)', marginBottom: 16,
  },
  avatarText: { color: '#f9a8d4', fontWeight: '900', fontSize: 36 },
  name: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
  email: { color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 4 },
  city: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 },
  section: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: 'rgba(244,114,182,0.1)',
  },
  sectionTitle: { color: 'rgba(249,168,212,0.8)', fontSize: 13, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  bioText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: 'rgba(244,114,182,0.15)', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  interestTag: { backgroundColor: 'rgba(139,92,246,0.15)' },
  likeTag: { backgroundColor: 'rgba(34,197,94,0.12)' },
  dislikeTag: { backgroundColor: 'rgba(239,68,68,0.12)' },
  tagText: { color: '#f9a8d4', fontSize: 13 },
  signOutBtn: {
    marginTop: 24, backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  signOutText: { color: '#f87171', fontWeight: '700', fontSize: 16 },
})
