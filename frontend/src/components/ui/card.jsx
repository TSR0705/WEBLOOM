import { cn } from '../../utils/cn'

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "glass-card rounded-xl transition-glow duration-300",
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
        'text-lg font-semibold tracking-tight text-white font-display',
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
        'text-sm text-muted-1',
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
