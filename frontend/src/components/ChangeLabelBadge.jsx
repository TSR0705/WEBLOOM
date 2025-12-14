import { Badge } from './ui/badge'
import { cn } from '../utils/cn'

export function ChangeLabelBadge({ label }) {
  if (!label) {
    return (
      <Badge
        className={cn(
          'bg-white/5 text-gray-300 border border-white/10',
          
        )}
      >
        Stable
      </Badge>
    )
  }

  const styles = {
    low: `
      bg-[#32FFC3]/15
      text-[#32FFC3]
      border border-[#32FFC3]/30
      
    `,
    medium: `
      bg-[#FFC35E]/15
      text-[#FFC35E]
      border border-[#FFC35E]/30
      
    `,
    high: `
      bg-[#FF4E66]/15
      text-[#FF4E66]
      border border-[#FF4E66]/30
      
    `,
  }

  return (
    <Badge
      className={cn(
        'capitalize font-medium',
        styles[label] || 'bg-white/5 text-gray-300 border border-white/10'
      )}
    >
      {label}
    </Badge>
  )
}
