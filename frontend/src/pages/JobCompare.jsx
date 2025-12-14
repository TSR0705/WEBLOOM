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
    <div className="space-y-10">
      {/* Back */}
      <Button
        variant="ghost"
        onClick={() => navigate(`/jobs/${jobId}/details`)}
        className="text-gray-400 hover:text-[#32FFC3] w-fit"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Job
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-white">
          Version Comparison
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Inspect structural and semantic changes between snapshots
        </p>
      </div>

      {/* Version Selector */}
      <Card className="bg-white/5 border border-white/5 backdrop-blur">
        <CardContent className="py-6 flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-1">Base Version</p>
            <select
              value={v1}
              onChange={e => setV1(Number(e.target.value))}
              className="
                w-full bg-black/40 border border-white/10
                rounded-lg px-3 py-2 text-gray-200
                focus:outline-none focus:ring-1 focus:ring-[#32FFC3]
              "
            >
              {versions.map(v => (
                <option key={v} value={v}>v{v}</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-1">Target Version</p>
            <select
              value={v2}
              onChange={e => setV2(Number(e.target.value))}
              className="
                w-full bg-black/40 border border-white/10
                rounded-lg px-3 py-2 text-gray-200
                focus:outline-none focus:ring-1 focus:ring-[#32FFC3]
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
        <Card className="bg-white/5 border border-white/5">
          <CardContent className="py-6 text-red-400">
            Failed to compare versions
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {data && (
        <>
          {/* Summary */}
          <Card className="bg-white/5 border border-white/5">
            <CardContent className="py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-gray-400">Base</p>
                <p className="text-lg text-white">v{data.baseVersion}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Target</p>
                <p className="text-lg text-white">v{data.targetVersion}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-white/10 text-gray-200">
                  {data.changeScore?.toFixed(4)}
                </Badge>
                <ChangeLabelBadge label={data.changeLabel} />
              </div>
            </CardContent>
          </Card>

          {/* Diff Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Text */}
            <Card className="bg-white/5 border border-white/5">
              <CardContent className="py-6 space-y-6">
                <div className="flex items-center gap-2 text-white">
                  <FileDiff className="w-5 h-5 text-[#32FFC3]" />
                  <h2 className="text-lg font-medium">Text Diff</h2>
                </div>

                <DiffBlock
                  title="Added"
                  items={data.diffs?.text?.added}
                  variant="positive"
                />
                <DiffBlock
                  title="Removed"
                  items={data.diffs?.text?.removed}
                  variant="negative"
                />
              </CardContent>
            </Card>

            {/* Links */}
            <Card className="bg-white/5 border border-white/5">
              <CardContent className="py-6 space-y-6">
                <div className="flex items-center gap-2 text-white">
                  <Link2 className="w-5 h-5 text-[#32FFC3]" />
                  <h2 className="text-lg font-medium">Link Diff</h2>
                </div>

                <DiffBlock
                  title="Added"
                  items={data.diffs?.links?.added}
                />
                <DiffBlock
                  title="Removed"
                  items={data.diffs?.links?.removed}
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
    <div>
      <p className="text-xs text-gray-400 mb-2">
        {title} ({items.length})
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No changes</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.slice(0, 40).map((item, i) => (
            <Badge
              key={i}
              className={`
                text-xs
                ${variant === 'positive' && 'bg-green-500/15 text-green-400'}
                ${variant === 'negative' && 'bg-red-500/15 text-red-400'}
                ${!variant && 'bg-white/10 text-gray-300'}
              `}
            >
              {item}
            </Badge>
          ))}
          {items.length > 40 && (
            <span className="text-xs text-gray-500">
              +{items.length - 40} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}
