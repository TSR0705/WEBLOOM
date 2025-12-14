import { cn } from '../../utils/cn'

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        `
        relative
        rounded-xl
        border border-white/5
        bg-white/5
        backdrop-blur
        shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_40px_rgba(2,6,23,0.6)]
        transition
        hover:border-white/10
        `,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 px-6 pt-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn(
        'text-lg font-semibold tracking-tight text-white',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p
      className={cn(
        'text-sm text-gray-400',
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
}

export function CardContent({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'px-6 py-5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-6 pb-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
