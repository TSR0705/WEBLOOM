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
} from "lucide-react"

/* ----------------------------------
   Small Insight Card
----------------------------------- */
function InsightCard({ label, value, icon: Icon, accent }) {
  return (
    <div
      className={`
        rounded-xl
        border border-white/5
        bg-white/5
        backdrop-blur
        px-5 py-4
        ${accent ? "shadow-[0_0_28px_rgba(50,255,195,0.15)]" : ""}
      `}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-[#32FFC3]" />
        <p className="text-sm text-gray-400">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
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
    <div className="space-y-10">
      {/* Back */}
      <Button
        variant="ghost"
        onClick={() => navigate("/dashboard")}
        className="text-gray-400 hover:text-[#32FFC3] w-fit"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      {/* Hero */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-semibold text-white tracking-tight">
            {job.name || "Unnamed Job"}
          </h1>
          {isRunActive && (
            <Badge variant={activeRun.status === 'running' ? 'success' : 'warning'}>
              {activeRun.status === 'running' ? 'Running' : 'Queued'}
            </Badge>
          )}
        </div>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#32FFC3] hover:underline"
        >
          {job.url}
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
      <Card className="bg-white/5 border border-white/5 backdrop-blur">
        <CardContent className="flex flex-wrap gap-4 py-6 items-center">
          {/* 🔥 Run Now - Disable during active run or mutation */}
          <Button
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending || isRunActive}
            className="gap-2"
          >
            <Play className="w-4 h-4" />
            {runMutation.isPending ? "Triggering…" : 
             isRunActive ? 
               (activeRun.status === 'running' ? "Run in progress…" : "Run queued…") : 
               "Run Now"}
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate(`/jobs/${jobId}/history`)}
          >
            View History
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate(`/jobs/${jobId}/compare`)}
          >
            Compare Versions
          </Button>

          {latestVersion > 0 && (
            <Button
              variant="outline"
              onClick={() =>
                navigate(`/jobs/${jobId}/version/${latestVersion}`)
              }
            >
              View Latest Version
            </Button>
          )}

          {/* Feedback - Show error or success */}
          {runMutation.isError && (
            <span className="text-sm text-red-400 ml-2">
              {runMutation.error?.response?.status === 409 
                ? "A run is already active for this job" 
                : "Failed to trigger run"}
            </span>
          )}

          {runMutation.isSuccess && !isRunActive && (
            <span className="text-sm text-[#32FFC3] ml-2">
              Run Completed Successfully.
            </span>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card className="bg-white/5 border border-white/5">
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
    <div>
      <p className="text-gray-400">{label}</p>
      <p className="text-gray-100 mt-1 font-mono break-all">{value}</p>
    </div>
  )
}
