import Image from 'next/image'
import { cn, getInitials } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  online?: boolean
  className?: string
}

const sizeMap = {
  xs: { outer: 'w-7 h-7', text: 'text-[10px]', dot: 'w-2 h-2 border' },
  sm: { outer: 'w-9 h-9', text: 'text-xs', dot: 'w-2.5 h-2.5 border' },
  md: { outer: 'w-11 h-11', text: 'text-sm', dot: 'w-3 h-3 border-[1.5px]' },
  lg: { outer: 'w-16 h-16', text: 'text-lg', dot: 'w-3.5 h-3.5 border-2' },
  xl: { outer: 'w-20 h-20', text: 'text-2xl', dot: 'w-4 h-4 border-2' },
}

export function Avatar({ src, name, size = 'md', online, className }: AvatarProps) {
  const s = sizeMap[size]
  const initials = getInitials(name)

  return (
    <div className={cn('relative flex-shrink-0', s.outer, className)}>
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          className="rounded-full object-cover"
          sizes="80px"
        />
      ) : (
        <div
          className={cn(
            'w-full h-full rounded-full flex items-center justify-center font-semibold',
            'bg-gradient-to-br from-violet-600 to-purple-800 text-white',
            s.text
          )}
        >
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-background',
            s.dot,
            online ? 'bg-emerald-400' : 'bg-gray-500'
          )}
        />
      )}
    </div>
  )
}
