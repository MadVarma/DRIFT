import ChatWindow from '@/components/chat/ChatWindow'

interface ChatPageProps {
  params: Promise<{ matchId: string }>
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { matchId } = await params
  return <ChatWindow matchId={matchId} />
}
