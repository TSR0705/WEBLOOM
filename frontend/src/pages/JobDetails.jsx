import { useParams, useNavigate } from "react-router-dom"
import { useJob, useJobStats } from "../hooks/useJobs"
import { useRunJob } from "../hooks/useRuns"
import { Card, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Skeleton } from "../components/ui/skeleton"
import {
  Activity,
  Clock,
  TrendingUp,
  FileText,
  ArrowLeft,
  Play,
  ExternalLink
} from "lucide-react"

/* ----------------------------------
   Small Insight Card
----------------------------------- */
function InsightCard({ label, value, icon: Icon, accent }) {
  return (
    <div
      className={`
        relative rounded-xl border p-5 transition-all duration-300 hover:-translate-y-[2px]
        ${accent 
          ? 'bg-gradient-to-br from-[#0a151f] to-[#04202b] border-[#32FFC3]/20 shadow-[0_0_20px_rgba(50,255,195,0.03)] hover:border-[#32FFC3]/40' 
          : 'bg-white/[0.02] border-white/5 hover:border-white/10'
        }
      `}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-1 font-display">{label}</p>
        {Icon && (
          <div className={`p-2 rounded-lg ${accent ? 'bg-[#32FFC3]/10 text-[#32FFC3]' : 'bg-white/5 text-muted-1'}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white mt-3 font-display tracking-tight">
        {value}
      </p>
    </div>
  )
}

export default function JobDetails() {
  const { jobId } = useParams()
  const navigate = useNavigate()

  const { data: job, isLoading: jobLoading, error: jobError } = useJob(jobId)
  const { data: stats, isLoading: statsLoading } = useJobStats(jobId)

  // 🔥 Phase 9B: Manual Run hook
  const runMutation = useRunJob(jobId)

  if (jobLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-80" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (jobError || !job) {
    return (
      <Card className="bg-white/5 border border-white/5">
        <CardContent className="pt-6">
          <p className="text-red-400">Failed to load job details</p>
        </CardContent>
      </Card>
    )
  }

  const statsData = stats?.data || {}
  const latestVersion = statsData.totalVersions || 0
  const activeRun = statsData.activeRun

  // Determine if run is active
  const isRunActive = activeRun && !['completed', 'failed'].includes(activeRun.status)

  return (
    <div className="space-y-8">
      {/* Back */}
      <Button
        variant="ghost"
        onClick={() => navigate("/dashboard")}
        className="text-muted-1 hover:text-white font-display font-medium text-xs px-2 h-8"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      {/* Hero Header */}
      <div className="border-b border-white/5 pb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-3xl font-bold text-white tracking-tight font-display">
            {job.name || "Unnamed Job"}
          </h1>
          {isRunActive ? (
            <Badge variant={activeRun.status === 'running' ? 'success' : 'warning'}>
              {activeRun.status === 'running' ? 'Running' : 'Queued'}
            </Badge>
          ) : (
            <Badge variant="default">Idle</Badge>
          )}
        </div>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-[#32FFC3] hover:underline mt-2 font-mono"
        >
          {job.url}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Insight Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <InsightCard
          label="Total Versions"
          value={statsLoading ? "—" : statsData.totalVersions || 0}
          icon={FileText}
          accent
        />
        <InsightCard
          label="High Changes"
          value={statsLoading ? "—" : statsData.highCount || 0}
          icon={TrendingUp}
        />
        <InsightCard
          label="Average Score"
          value={
            statsLoading
              ? "—"
              : statsData.avgScore
              ? statsData.avgScore.toFixed(3)
              : "0.000"
          }
          icon={Activity}
        />
        <InsightCard
          label="Last Run"
          value={
            statsLoading
              ? "—"
              : statsData.lastRunAt
              ? new Date(statsData.lastRunAt).toLocaleString()
              : "Never"
          }
          icon={Clock}
        />
      </div>

      {/* Primary Actions */}
      <Card className="glass-panel border-white/5 overflow-hidden">
        <CardContent className="flex flex-wrap gap-4 py-5 items-center">
          {/* 🔥 Run Now - Disable during active run or mutation */}
          <Button
            variant="primary"
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending || isRunActive}
            className="gap-2 font-display font-semibold"
          >
            <Play className="w-4 h-4 fill-current" />
            {runMutation.isPending ? "Triggering…" : 
             isRunActive ? 
               (activeRun.status === 'running' ? "Run in progress…" : "Run queued…") : 
               "Run Now"}
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate(`/jobs/${jobId}/history`)}
            className="font-display font-medium"
          >
            View History
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate(`/jobs/${jobId}/compare`)}
            className="font-display font-medium"
          >
            Compare Versions
          </Button>

          {latestVersion > 0 && (
            <Button
              variant="outline"
              onClick={() =>
                navigate(`/jobs/${jobId}/version/${latestVersion}`)
              }
              className="font-display font-medium"
            >
              View Latest Version
            </Button>
          )}

          {/* Feedback - Show error or success */}
          {runMutation.isError && (
            <span className="text-xs text-[#FF4E66] font-mono font-medium ml-2">
              {runMutation.error?.response?.status === 409 
                ? "A run is already active for this job" 
                : "Failed to trigger run"}
            </span>
          )}

          {runMutation.isSuccess && !isRunActive && (
            <span className="text-xs text-[#32FFC3] font-mono font-medium ml-2">
              Run Completed Successfully.
            </span>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card className="glass-panel border-white/5 overflow-hidden">
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 text-sm">
          <Meta label="Job ID" value={job._id} />
          <Meta label="Schedule" value={job.schedule || "Not scheduled"} />
          <Meta
            label="Created At"
            value={
              job.createdAt
                ? new Date(job.createdAt).toLocaleString()
                : "—"
            }
          />
          <Meta
            label="First Run"
            value={
              statsData.firstRunAt
                ? new Date(statsData.firstRunAt).toLocaleString()
                : "Never"
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}

/* ----------------------------------
   Meta Row
----------------------------------- */
function Meta({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-1 font-display">{label}</p>
      <p className="text-sm text-white font-mono break-all bg-white/[0.01] border border-white/5 rounded-lg px-3 py-2">{value}</p>
    </div>
  )
}
