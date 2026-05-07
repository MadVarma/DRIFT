import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import Providers from '@/components/Providers'
import { HeartCursorGlobal } from '@/components/HeartCursorGlobal'
import { LoveDoodles } from '@/components/LoveDoodles'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'DRIFT — Connect through what you actually do',
    template: '%s | DRIFT',
  },
  description:
    'DRIFT is a new kind of connection app. No swiping. You match based on shared passions and shared dislikes. Real compatibility, real connections.',
  keywords: ['dating', 'connections', 'social', 'drift', 'compatibility'],
  openGraph: {
    title: 'DRIFT',
    description: 'Stop swiping. Start drifting.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen gradient-bg-animated antialiased" style={{ cursor: 'none' }}>
        {/* Scattered love doodles — subtle, on all pages */}
        <LoveDoodles />

        <Providers>
          {children}
          <Toaster
            position="top-center"
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(15,10,25,0.95)',
                color: 'hsl(240 5% 92%)',
                border: '1px solid rgba(236,72,153,0.25)',
                borderRadius: '12px',
                fontSize: '14px',
                backdropFilter: 'blur(16px)',
              },
              success: {
                iconTheme: { primary: '#ec4899', secondary: '#0a0a10' },
              },
            }}
          />
        </Providers>

        {/* Global heart cursor — renders on top of everything */}
        <HeartCursorGlobal />
      </body>
    </html>
  )
}
