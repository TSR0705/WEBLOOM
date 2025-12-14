import { cn } from '../../utils/cn'

export function Badge({
  className,
  variant = 'default',
  children,
  ...props
}) {
  const variants = {
    default: `
      bg-white/5
      text-gray-300
      border border-white/10
    `,

    success: `
      bg-[#32FFC3]/15
      text-[#32FFC3]
      border border-[#32FFC3]/30
      shadow-[0_0_10px_rgba(50,255,195,0.25)]
    `,

    warning: `
      bg-[#FFC35E]/15
      text-[#FFC35E]
      border border-[#FFC35E]/30
      shadow-[0_0_10px_rgba(255,195,94,0.25)]
    `,

    destructive: `
      bg-[#FF4E66]/15
      text-[#FF4E66]
      border border-[#FF4E66]/30
      shadow-[0_0_12px_rgba(255,78,102,0.35)]
    `,

    secondary: `
      bg-[#3B82F6]/15
      text-[#60A5FA]
      border border-[#3B82F6]/30
    `,
  }

  return (
    <span
      className={cn(
        `
        inline-flex items-center gap-1
        rounded-full
        px-3 py-1
        text-xs font-medium
        tracking-wide
        transition
        `,
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
