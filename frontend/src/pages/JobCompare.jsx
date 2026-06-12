import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useJobCompare, useJobHistory } from '../hooks/useJobs'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { Badge } from '../components/ui/badge'
import { ChangeLabelBadge } from '../components/ChangeLabelBadge'
import {
  ArrowLeft,
  GitCompare,
  FileDiff,
  Link2,
} from 'lucide-react'

export default function JobCompare() {
  const { jobId } = useParams()
  const navigate = useNavigate()

  const { data: historyData } = useJobHistory(jobId)
  const timeline = historyData?.timeline || []

  const versions = timeline
    .map(v => v.version)
    .filter(v => v != null)
    .sort((a, b) => a - b)

  const [v1, setV1] = useState(versions.at(0))
  const [v2, setV2] = useState(versions.at(-1))

  const { data, isLoading, error } = useJobCompare(jobId, v1, v2)

  if (versions.length < 2) {
    return (
      <Card className="bg-white/5 border border-white/5">
        <CardContent className="py-6">
          <p className="text-gray-400">
            Not enough versions to perform comparison.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Back */}
      <Button
        variant="ghost"
        onClick={() => navigate(`/jobs/${jobId}/details`)}
        className="text-muted-1 hover:text-white font-display font-medium text-xs px-2 h-8"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Job
      </Button>

      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight font-display">
          Version Comparison
        </h1>
        <p className="text-muted-1 mt-1 text-sm">
          Inspect structural and semantic changes between snapshots
        </p>
      </div>

      {/* Version Selector */}
      <Card className="glass-panel border-white/5 overflow-hidden">
        <CardContent className="py-6 flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-1 font-display mb-2">Base Version</p>
            <select
              value={v1}
              onChange={e => setV1(Number(e.target.value))}
              className="
                w-full bg-[#030508] border border-white/10
                rounded-lg px-3 py-2 text-white text-sm
                focus:outline-none focus:border-[#32FFC3]/50 focus:ring-1 focus:ring-[#32FFC3]/50
                font-mono font-medium transition-all duration-200
              "
            >
              {versions.map(v => (
                <option key={v} value={v}>v{v}</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-1 font-display mb-2">Target Version</p>
            <select
              value={v2}
              onChange={e => setV2(Number(e.target.value))}
              className="
                w-full bg-[#030508] border border-white/10
                rounded-lg px-3 py-2 text-white text-sm
                focus:outline-none focus:border-[#32FFC3]/50 focus:ring-1 focus:ring-[#32FFC3]/50
                font-mono font-medium transition-all duration-200
              "
            >
              {versions.map(v => (
                <option key={v} value={v}>v{v}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading && (
        <Skeleton className="h-[320px]" />
      )}

      {/* Error */}
      {error && (
        <Card className="glass-panel border-[#FF4E66]/20">
          <CardContent className="py-6 text-xs text-[#FF4E66] font-mono">
            Failed to compare versions
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {data && (
        <>
          {/* Summary */}
          <Card className="glass-panel border-white/5 overflow-hidden">
            <CardContent className="py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-1 font-display">Base Snapshot</p>
                <p className="text-lg font-bold text-white font-mono mt-1">v{data.baseVersion}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-1 font-display">Target Snapshot</p>
                <p className="text-lg font-bold text-white font-mono mt-1">v{data.targetVersion}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="default" className="font-mono">
                  Score: {data.changeScore?.toFixed(4)}
                </Badge>
                <ChangeLabelBadge label={data.changeLabel} />
              </div>
            </CardContent>
          </Card>

          {/* Diff Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Text */}
            <Card className="glass-panel border-white/5 overflow-hidden">
              <CardContent className="py-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <FileDiff className="w-5 h-5 text-[#32FFC3]" />
                  <h2 className="text-base font-semibold text-white font-display">Text Changes</h2>
                </div>

                <DiffBlock
                  title="Added lines"
                  items={data.diffs?.text?.added}
                  variant="positive"
                />
                <DiffBlock
                  title="Removed lines"
                  items={data.diffs?.text?.removed}
                  variant="negative"
                />
              </CardContent>
            </Card>

            {/* Links */}
            <Card className="glass-panel border-white/5 overflow-hidden">
              <CardContent className="py-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <Link2 className="w-5 h-5 text-[#32FFC3]" />
                  <h2 className="text-base font-semibold text-white font-display">Link Changes</h2>
                </div>

                <DiffBlock
                  title="Added URLs"
                  items={data.diffs?.links?.added}
                  variant="positive"
                />
                <DiffBlock
                  title="Removed URLs"
                  items={data.diffs?.links?.removed}
                  variant="negative"
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

function DiffBlock({ title, items = [], variant }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-1 font-display">
        {title} ({items.length})
      </p>

      {items.length === 0 ? (
        <p className="text-xs text-muted-2 font-mono">No differences</p>
      ) : (
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 bg-black/25 p-3 rounded-lg border border-white/5">
          {items.slice(0, 40).map((item, i) => (
            <Badge
              key={i}
              className={`
                font-mono text-[10px] break-all lowercase
                ${variant === 'positive' && 'bg-[#32FFC3]/10 text-[#32FFC3] border-[#32FFC3]/20'}
                ${variant === 'negative' && 'bg-[#FF4E66]/10 text-[#FF4E66] border-[#FF4E66]/20'}
                ${!variant && 'bg-white/5 text-gray-300 border-white/5'}
              `}
            >
              {item}
            </Badge>
          ))}
          {items.length > 40 && (
            <span className="text-[10px] text-muted-2 font-mono self-center">
              +{items.length - 40} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}
