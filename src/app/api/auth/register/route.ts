import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { createId } from '@paralleldrive/cuid2'
import { supabase } from '@/lib/supabase'

const schema = z.object({
  name: z.string().min(2).max(80).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(128),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, email, password } = parsed.data

    const { data: existing } = await supabase.from('User').select('id').eq('email', email).single()
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const now = new Date().toISOString()

    const { data: user, error } = await supabase.from('User').insert({
      id: createId(),
      name,
      email,
      password: hashed,
      dateOfBirth: '2000-01-01T00:00:00.000Z',
      gender: 'other',
      isOnboarded: false,
      isActive: true,
      lastSeen: now,
      createdAt: now,
      updatedAt: now,
    }).select('id, name, email').single()

    if (error) throw error

    return NextResponse.json({ user }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/auth/register]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
