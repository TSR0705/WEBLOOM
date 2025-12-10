import { Badge } from './ui/badge'

export function ChangeLabelBadge({ label }) {
  if (!label) {
    return <Badge variant="default">No change</Badge>
  }

  const variantMap = {
    low: 'success',
    medium: 'warning',
    high: 'destructive',
  }

  return (
    <Badge variant={variantMap[label] || 'default'} className="capitalize">
      {label}
    </Badge>
  )
}

