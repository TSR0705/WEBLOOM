import { Card, CardContent } from './ui/card'
import { cn } from '../utils/cn'

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  accent = 'default',
}) {
  const accents = {
    default: 'text-gray-400',
    green: 'text-[#32FFC3]',
    amber: 'text-[#FFC35E]',
    red: 'text-[#FF4E66]',
    blue: 'text-[#60A5FA]',
  }

  return (
    <Card
      className="
        group
        relative
        overflow-hidden
        hover:border-white/10
        transition
      "
    >
      {/* Subtle accent glow */}
      <div
        className={cn(
          'absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-2xl',
          accent === 'green' && 'bg-[#32FFC3]',
          accent === 'amber' && 'bg-[#FFC35E]',
          accent === 'red' && 'bg-[#FF4E66]',
          accent === 'blue' && 'bg-[#60A5FA]'
        )}
      />

      <CardContent className="relative space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-gray-400">
            {title}
          </p>

          {Icon && (
            <Icon
              className={cn(
                'h-4 w-4 transition',
                accents[accent]
              )}
            />
          )}
        </div>

        {/* Value */}
        <div
          className={cn(
            'text-3xl font-semibold tracking-tight',
            accents[accent]
          )}
        >
          {value}
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-gray-500">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
