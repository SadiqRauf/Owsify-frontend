import { cn, initials } from '@/lib/utils'

interface AvatarProps {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-16 text-lg',
} as const

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const classes = cn(
    'flex shrink-0 items-center justify-center rounded-full object-cover font-semibold',
    SIZES[size],
    className,
  )

  if (src) {
    return <img src={src} alt={name} className={classes} />
  }

  return (
    <span aria-hidden className={cn(classes, 'bg-brand-100 text-brand-800')}>
      {initials(name)}
    </span>
  )
}
