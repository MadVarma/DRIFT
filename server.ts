import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketServer } from 'socket.io'

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT ?? '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const io = new SocketServer(httpServer, {
    path: '/api/socketio',
    cors: {
      // In dev allow all origins so LAN devices and localhost both work.
      // In production this is locked down via NEXT_PUBLIC_APP_URL.
      origin: dev ? true : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  // Make io available globally for API routes
  ;(global as Record<string, unknown>).io = io

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`)

    socket.on('join-match', (matchId: string) => {
      void socket.join(`match:${matchId}`)
    })

    socket.on('leave-match', (matchId: string) => {
      void socket.leave(`match:${matchId}`)
    })

    socket.on('join-feed', () => {
      void socket.join('drift-feed')
    })

    socket.on('leave-feed', () => {
      void socket.leave('drift-feed')
    })

    socket.on('typing', (data: { matchId: string; userId: string; userName: string }) => {
      socket.to(`match:${data.matchId}`).emit('user-typing', {
        userId: data.userId,
        userName: data.userName,
      })
    })

    socket.on('stop-typing', (data: { matchId: string; userId: string }) => {
      socket.to(`match:${data.matchId}`).emit('user-stop-typing', data.userId)
    })

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${socket.id} (${reason})`)
    })
  })

  httpServer.once('error', (err) => {
    console.error(err)
    process.exit(1)
  })

  httpServer.listen(port, () => {
    console.log(`\n  ✦ DRIFT running at http://localhost:${port}`)
    console.log(`  ✦ Mode: ${dev ? 'development' : 'production'}\n`)
  })
})
