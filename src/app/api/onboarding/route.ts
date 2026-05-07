import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { calculateAge } from '@/lib/utils'
import { createId } from '@paralleldrive/cuid2'

const schema = z.object({
  name: z.string().min(2).max(80),
  dateOfBirth: z.string().refine((d) => !isNaN(Date.parse(d))),
  gender: z.enum(['male', 'female', 'non-binary', 'other']),
  height: z.number().min(100).max(250).optional(),
  ethnicity: z.string().max(50).optional(),
  bio: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  hobbies: z.array(z.string()).max(15),
  interests: z.array(z.string()).max(15),
  likes: z.array(z.string()).min(1).max(20),
  dislikes: z.array(z.string()).min(1).max(20),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, dateOfBirth, gender, height, ethnicity, bio, city, lat, lng,
            hobbies, interests, likes, dislikes } = parsed.data

    const dob = new Date(dateOfBirth)
    const age = calculateAge(dob)
    if (age < 18) {
      return NextResponse.json({ error: 'You must be at least 18 years old' }, { status: 400 })
    }

    const now = new Date().toISOString()

    // Update user
    const { data: user, error: userError } = await supabase
      .from('User')
      .update({
        name: name.trim(),
        dateOfBirth: dob.toISOString(),
        gender,
        height: height ?? null,
        ethnicity: ethnicity ?? null,
        bio: bio?.trim() ?? null,
        city: city?.trim() ?? null,
        lat: lat ?? null,
        lng: lng ?? null,
        isOnboarded: true,
        updatedAt: now,
      })
      .eq('id', session.user.id)
      .select('id, name, email, bio, city, avatar, isOnboarded, gender, dateOfBirth')
      .single()

    if (userError) throw userError

    // Check if preferences exist
    const { data: existingPrefs } = await supabase
      .from('UserPreferences')
      .select('id')
      .eq('userId', session.user.id)
      .single()

    if (existingPrefs) {
      await supabase.from('UserPreferences').update({ likes, dislikes, hobbies, interests, updatedAt: now }).eq('userId', session.user.id)
    } else {
      await supabase.from('UserPreferences').insert({ id: createId(), userId: session.user.id, likes, dislikes, hobbies, interests, createdAt: now, updatedAt: now })
    }

    return NextResponse.json({ user })
  } catch (err) {
    console.error('[POST /api/onboarding]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
