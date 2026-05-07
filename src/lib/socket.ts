import { Server as SocketServer } from 'socket.io'

/**
 * Get the globally-attached Socket.io server instance (set by server.ts).
 * Returns null in serverless/build environments.
 */
export function getIO(): SocketServer | null {
  return (global as Record<string, unknown>).io as SocketServer | null
}

/**
 * Emit a new drift post to all clients watching the feed.
 */
export function emitNewDriftPost(post: unknown) {
  const io = getIO()
  io?.to('drift-feed').emit('new-drift-post', post)
}

/**
 * Emit a new message to all clients in a match room.
 */
export function emitNewMessage(matchId: string, message: unknown) {
  const io = getIO()
  io?.to(`match:${matchId}`).emit('new-message', message)
}

/**
 * Emit a match created event to a specific socket room (by userId).
 */
export function emitMatchCreated(userId: string, match: unknown) {
  const io = getIO()
  io?.to(`user:${userId}`).emit('match-created', match)
}

/**
 * Emit match expired event.
 */
export function emitMatchExpired(matchId: string) {
  const io = getIO()
  io?.to(`match:${matchId}`).emit('match-expired', { matchId })
}
