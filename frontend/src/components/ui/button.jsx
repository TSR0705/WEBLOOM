import { cn } from '../../utils/cn'

export function Button({
  className,
  variant = 'outline',
  size = 'md',
  children,
  ...props
}) {
  const variants = {
    primary: `
      bg-[#32FFC3]
      text-[#061018]
      hover:bg-[#2FF8B6]
      shadow-[0_0_20px_rgba(50,255,195,0.25)]
    `,

    outline: `
      border border-white/10
      bg-transparent
      text-gray-200
      hover:border-[#32FFC3]/40
      hover:text-[#32FFC3]
      hover:bg-white/5
    `,

    ghost: `
      bg-transparent
      text-gray-400
      hover:bg-white/5
      hover:text-[#32FFC3]
    `,

    destructive: `
      bg-[#FF4E66]
      text-white
      hover:bg-[#FF667C]
      shadow-[0_0_12px_rgba(255,78,102,0.35)]
    `,
  }

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
    icon: 'h-10 w-10',
  }

  return (
    <button
      className={cn(
        `
        inline-flex items-center justify-center rounded-md
        font-medium transition-all
        focus:outline-none
        focus:ring-2 focus:ring-[#32FFC3]/40
        focus:ring-offset-0
        disabled:opacity-50
        disabled:pointer-events-none
        `,
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
