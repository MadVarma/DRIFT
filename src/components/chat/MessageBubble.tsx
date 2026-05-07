import { Avatar } from '@/components/ui/Avatar'
import { formatTimeAgo, cn } from '@/lib/utils'
import type { MessageWithSender } from '@/types'

interface MessageBubbleProps {
  message: MessageWithSender
  isOwn: boolean
  showAvatar?: boolean
}

export function MessageBubble({ message, isOwn, showAvatar = true }: MessageBubbleProps) {
  return (
    <div className={cn('flex items-end gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar placeholder for alignment */}
      <div className="w-6 flex-shrink-0">
        {!isOwn && showAvatar && (
          <Avatar
            src={message.sender.avatar}
            name={message.sender.name}
            size="xs"
          />
        )}
      </div>

      <div
        className={cn(
          'max-w-[75%] flex flex-col',
          isOwn ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words',
            isOwn
              ? 'bg-primary text-white rounded-br-sm'
              : 'bg-card border border-border text-gray-900 rounded-bl-sm'
          )}
        >
          {message.content}
        </div>
        <span className="text-[10px] text-muted-foreground/50 mt-1 px-1">
          {formatTimeAgo(message.createdAt)}
        </span>
      </div>
    </div>
  )
}
