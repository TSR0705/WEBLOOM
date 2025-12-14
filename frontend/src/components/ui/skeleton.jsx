import { cn } from '../../utils/cn'

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        `
        relative
        overflow-hidden
        rounded-md

        bg-[#0C0F14]
        border border-white/5

        before:absolute
        before:inset-0
        before:-translate-x-full
        before:animate-[skeleton-shimmer_2.4s_ease-in-out_infinite]
        before:bg-gradient-to-r
        before:from-transparent
        before:via-white/[0.06]
        before:to-transparent
        `,
        className
      )}
      {...props}
    />
  )
}
