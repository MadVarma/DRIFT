import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { apiFetch } from '../src/api/client'
import { useAuth } from '../src/context/AuthContext'

const HOBBIES = ['Reading', 'Hiking', 'Gaming', 'Cooking', 'Photography', 'Travel', 'Music', 'Art', 'Yoga', 'Cycling']
const INTERESTS = ['Tech', 'Film', 'Science', 'Fashion', 'Sports', 'Food', 'Politics', 'Nature', 'History', 'Startups']
const LIKES = ['Coffee', 'Late nights', 'Road trips', 'Live music', 'Good books', 'Sunsets', 'Rainy days', 'Street food', 'Deep conversations', 'Spontaneous plans']
const DISLIKES = ['Small talk', 'Loud clubs', 'Bad Wi-Fi', 'Slow walkers', 'Ghosting', 'Toxic positivity', 'Cold coffee', 'Unsolicited opinions']

function TagPicker({ label, options, selected, onToggle }: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (tag: string) => void
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.tagsRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.tag, selected.includes(opt) && styles.tagSelected]}
            onPress={() => onToggle(opt)}
          >
            <Text style={[styles.tagText, selected.includes(opt) && styles.tagTextSelected]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

export default function OnboardingScreen() {
  const { refreshUser } = useAuth()
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [hobbies, setHobbies] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])
  const [likes, setLikes] = useState<string[]>([])
  const [dislikes, setDislikes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  function toggle(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item])
  }

  async function handleSubmit() {
    if (hobbies.length < 2 || interests.length < 2 || likes.length < 2 || dislikes.length < 2) {
      Alert.alert('Almost there!', 'Please pick at least 2 items in each category')
      return
    }
    setLoading(true)
    try {
      await apiFetch('/api/onboarding', {
        method: 'POST',
        body: { bio, city, hobbies, interests, likes, dislikes },
      })
      await refreshUser()
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient colors={['#1e0512', '#2d0a1a']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Let&apos;s set up your profile</Text>
          <Text style={styles.subtitle}>Tell people who you really are</Text>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Your bio</Text>
            <TextInput
              style={styles.input}
              placeholder="Something real about you..."
              placeholderTextColor="#9ca3af"
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={200}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Your city</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Mumbai, Delhi, Bangalore"
              placeholderTextColor="#9ca3af"
              value={city}
              onChangeText={setCity}
            />
          </View>

          <TagPicker label="Hobbies (pick 2+)" options={HOBBIES} selected={hobbies} onToggle={(t) => toggle(hobbies, setHobbies, t)} />
          <TagPicker label="Interests (pick 2+)" options={INTERESTS} selected={interests} onToggle={(t) => toggle(interests, setInterests, t)} />
          <TagPicker label="Things you ❤️ (pick 2+)" options={LIKES} selected={likes} onToggle={(t) => toggle(likes, setLikes, t)} />
          <TagPicker label="Things you 💔 (pick 2+)" options={DISLIKES} selected={dislikes} onToggle={(t) => toggle(dislikes, setDislikes, t)} />

          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
            <LinearGradient
              colors={['#f472b6', '#ec4899', '#db2777']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Start Drifting 🌊</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingVertical: 24, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '900', color: '#f9a8d4', marginBottom: 6 },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 15, marginBottom: 28 },
  section: { marginBottom: 20 },
  sectionLabel: { color: 'rgba(249,168,212,0.8)', fontSize: 13, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#fff',
    borderWidth: 1, borderColor: 'rgba(244,114,182,0.15)',
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  tagSelected: { backgroundColor: 'rgba(244,114,182,0.25)', borderColor: 'rgba(244,114,182,0.5)' },
  tagText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  tagTextSelected: { color: '#f9a8d4', fontWeight: '600' },
  button: { marginTop: 12, borderRadius: 14, overflow: 'hidden' },
  buttonGradient: { paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '800' },
})
