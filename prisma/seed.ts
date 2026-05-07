import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { addHours } from 'date-fns'

const prisma = new PrismaClient()

const HOBBIES = ['Reading', 'Hiking', 'Gaming', 'Cooking', 'Photography', 'Travel', 'Music', 'Art', 'Yoga', 'Cycling']
const INTERESTS = ['Tech', 'Film', 'Science', 'Fashion', 'Sports', 'Food', 'Politics', 'Nature', 'History', 'Startups']
const LIKES = ['Coffee', 'Late nights', 'Road trips', 'Live music', 'Good books', 'Sunsets', 'Rainy days', 'Street food', 'Deep conversations', 'Spontaneous plans']
const DISLIKES = ['Small talk', 'Loud clubs', 'Bad Wi-Fi', 'Slow walkers', 'Cancel culture', 'Toxic positivity', 'Overly curated feeds', 'Ghosting', 'Unsolicited opinions', 'Cold coffee']

async function main() {
  console.log('🌊 Seeding DRIFT database...')

  // Clean existing data
  await prisma.message.deleteMany()
  await prisma.match.deleteMany()
  await prisma.interaction.deleteMany()
  await prisma.driftPost.deleteMany()
  await prisma.userPreferences.deleteMany()
  await prisma.user.deleteMany()

  const hashedPassword = await bcrypt.hash('password123', 12)

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'alex@drift.app',
        password: hashedPassword,
        name: 'Alex Rivera',
        dateOfBirth: new Date('1997-03-15'),
        gender: 'male',
        height: 178,
        ethnicity: 'Hispanic',
        bio: 'Building things by day, exploring cities by night. Always down for a good espresso.',
        city: 'San Francisco',
        lat: 37.7749,
        lng: -122.4194,
        isOnboarded: true,
        preferences: {
          create: {
            likes: ['Coffee', 'Late nights', 'Road trips', 'Live music'],
            dislikes: ['Small talk', 'Loud clubs', 'Ghosting'],
            hobbies: ['Photography', 'Travel', 'Cycling'],
            interests: ['Tech', 'Startups', 'Film'],
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'maya@drift.app',
        password: hashedPassword,
        name: 'Maya Chen',
        dateOfBirth: new Date('1998-07-22'),
        gender: 'female',
        height: 165,
        ethnicity: 'Asian',
        bio: 'Designer who over-thinks color palettes and under-thinks what to cook for dinner.',
        city: 'San Francisco',
        lat: 37.7765,
        lng: -122.4172,
        isOnboarded: true,
        preferences: {
          create: {
            likes: ['Coffee', 'Sunsets', 'Deep conversations', 'Good books'],
            dislikes: ['Small talk', 'Ghosting', 'Toxic positivity'],
            hobbies: ['Art', 'Photography', 'Yoga'],
            interests: ['Tech', 'Fashion', 'Film'],
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'jordan@drift.app',
        password: hashedPassword,
        name: 'Jordan Park',
        dateOfBirth: new Date('1996-11-08'),
        gender: 'non-binary',
        height: 172,
        ethnicity: 'Korean',
        bio: 'Software engineer obsessed with music theory and really good ramen.',
        city: 'Oakland',
        lat: 37.8044,
        lng: -122.2712,
        isOnboarded: true,
        preferences: {
          create: {
            likes: ['Live music', 'Street food', 'Late nights', 'Spontaneous plans'],
            dislikes: ['Loud clubs', 'Slow walkers', 'Bad Wi-Fi'],
            hobbies: ['Music', 'Gaming', 'Cooking'],
            interests: ['Tech', 'Science', 'Food'],
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'sam@drift.app',
        password: hashedPassword,
        name: 'Sam Okafor',
        dateOfBirth: new Date('1999-05-18'),
        gender: 'female',
        height: 170,
        ethnicity: 'Nigerian',
        bio: 'Storyteller, wanderer, terrible dancer. I make up for it with great playlists.',
        city: 'Berkeley',
        lat: 37.8716,
        lng: -122.2727,
        isOnboarded: true,
        preferences: {
          create: {
            likes: ['Road trips', 'Deep conversations', 'Rainy days', 'Good books'],
            dislikes: ['Small talk', 'Toxic positivity', 'Overly curated feeds'],
            hobbies: ['Reading', 'Travel', 'Music'],
            interests: ['History', 'Politics', 'Film'],
          },
        },
      },
    }),
  ])

  console.log(`✓ Created ${users.length} seed users`)

  // Create drift posts
  const driftContents = [
    { content: 'Drifting at a coffee shop ☕ watching the rain hit the window.', emoji: '☕', city: 'San Francisco' },
    { content: 'Late night coding session 💻 fueled by lo-fi and too much caffeine.', emoji: '💻', city: 'San Francisco' },
    { content: 'Golden hour walk along the waterfront 🌅', emoji: '🌅', city: 'Oakland' },
    { content: 'Discovering a new record store on 24th St 🎵', emoji: '🎵', city: 'San Francisco' },
    { content: 'Farmer\'s market haul. Someone stop me from buying more produce I won\'t use 🥬', emoji: '🥬', city: 'Berkeley' },
    { content: 'Sketching in Dolores Park. The city looks different from the grass 🎨', emoji: '🎨', city: 'San Francisco' },
  ]

  const posts = await Promise.all(
    driftContents.map((content, i) =>
      prisma.driftPost.create({
        data: {
          userId: users[i % users.length].id,
          content: content.content,
          emoji: content.emoji,
          city: content.city,
          expiresAt: addHours(new Date(), 20 - i * 2),
        },
      })
    )
  )

  console.log(`✓ Created ${posts.length} drift posts`)

  // Create a sample match between alex and maya (they have compatible prefs)
  const match = await prisma.match.create({
    data: {
      userAId: users[0].id,
      userBId: users[1].id,
      score: 18,
      commonLikes: ['Coffee'],
      commonDislikes: ['Small talk', 'Ghosting'],
      commonHobbies: ['Photography'],
      expiresAt: addHours(new Date(), 18),
    },
  })

  // Add some messages to the match
  await prisma.message.createMany({
    data: [
      { matchId: match.id, senderId: users[0].id, content: 'Hey! Saw you were also at a coffee shop 😄', isRead: true },
      { matchId: match.id, senderId: users[1].id, content: 'Ha! Which one? I\'m at Sightglass right now', isRead: true },
      { matchId: match.id, senderId: users[0].id, content: 'No way, I\'m at Ritual on Valencia! Classic SF coffee people lol', isRead: false },
    ],
  })

  console.log(`✓ Created 1 sample match with messages`)
  console.log('\n✦ Seed complete! You can log in with:')
  console.log('  Email: alex@drift.app')
  console.log('  Password: password123\n')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
