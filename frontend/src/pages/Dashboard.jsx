import { useNavigate } from 'react-router-dom'
import { useJobs, useJobStats, useJobHistory } from '../hooks/useJobs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { Badge } from '../components/ui/badge'
import { ChangeLabelBadge } from '../components/ChangeLabelBadge'

/* -------------------------------
   Row Component
-------------------------------- */
function DashboardRow({ job }) {
  const navigate = useNavigate()
  const { data: stats, isLoading: statsLoading } = useJobStats(job._id)
  const { data: history } = useJobHistory(job._id)

  const timeline = history?.data?.timeline || []
  const lastChange = timeline[timeline.length - 1]
  const activeRun = stats?.data?.activeRun
  const isRunActive = activeRun && !['completed', 'failed'].includes(activeRun.status)

  return (
    <TableRow
      onClick={() => navigate(`/jobs/${job._id}/details`)}
      className="
        cursor-pointer
        border-white/5
        hover:bg-white/5
        transition-colors
      "
    >
      <TableCell className="font-medium text-gray-100">
        {job.name || 'Unnamed Job'}
      </TableCell>

      <TableCell>
        {statsLoading ? (
          <Skeleton className="h-5 w-16" />
        ) : isRunActive ? (
          <Badge variant={activeRun.status === 'running' ? 'success' : 'warning'}>
            {activeRun.status === 'running' ? 'Running' : 'Queued'}
          </Badge>
        ) : (
          <Badge variant="secondary">Idle</Badge>
        )}
      </TableCell>

      <TableCell className="max-w-[260px] truncate text-gray-400">
        {job.url}
      </TableCell>

      <TableCell className="text-gray-200">
        {statsLoading ? (
          <Skeleton className="h-4 w-6" />
        ) : (
          stats?.data?.totalVersions ?? 0
        )}
      </TableCell>

      <TableCell>
        {statsLoading ? (
          <Skeleton className="h-5 w-14" />
        ) : (
          <ChangeLabelBadge label={lastChange?.analysisLabel} />
        )}
      </TableCell>

      <TableCell className="text-gray-400">
        {statsLoading ? (
          <Skeleton className="h-4 w-24" />
        ) : stats?.data?.lastRunAt ? (
          new Date(stats.data.lastRunAt).toLocaleString()
        ) : (
          '—'
        )}
      </TableCell>

      <TableCell className="text-gray-200">
        {statsLoading ? (
          <Skeleton className="h-4 w-10" />
        ) : stats?.data?.avgScore != null ? (
          stats.data.avgScore.toFixed(3)
        ) : (
          '—'
        )}
      </TableCell>
    </TableRow>
  )
}

/* -------------------------------
   Dashboard Page
-------------------------------- */
export default function Dashboard() {
  const { data, isLoading, error } = useJobs()
  const jobs = Array.isArray(data) ? data : []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card className="bg-white/5 border border-white/5 backdrop-blur">
          <CardContent className="space-y-4 py-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-white/5 border border-white/5">
        <CardContent className="pt-6">
          <p className="text-red-400">
            Failed to load dashboard
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Dashboard
        </h1>
        <p className="text-gray-400 mt-1">
          Live overview of all monitored web jobs
        </p>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Jobs" value={jobs.length} />
        <StatCard
          label="Total Versions"
          value={jobs.reduce((sum, j) => sum + (j.totalVersions || 0), 0)}
        />
        <StatCard label="Active Monitoring" value="Live" accent />
        <StatCard label="System Status" value="Healthy" accent />
      </div>

      {/* Jobs Table */}
      <Card className="bg-white/5 border border-white/5 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-gray-100">
            Tracked Jobs
          </CardTitle>
        </CardHeader>

        {/* 🔥 FIX: SCROLLABLE AREA */}
        <CardContent
          className="
            p-0
            max-h-[520px]
            overflow-y-auto
            overscroll-contain
          "
        >
          <Table>
            <TableHeader className="sticky top-0 bg-[#0C0F14] z-10">
              <TableRow className="border-white/10">
                <TableHead className="text-gray-400">Job</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">URL</TableHead>
                <TableHead className="text-gray-400">Versions</TableHead>
                <TableHead className="text-gray-400">Last Change</TableHead>
                <TableHead className="text-gray-400">Last Run</TableHead>
                <TableHead className="text-gray-400">Avg Score</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-gray-500 py-10"
                  >
                    No jobs found. Create one to start monitoring.
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <DashboardRow key={job._id} job={job} />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

/* -------------------------------
   Small Stat Card
-------------------------------- */
function StatCard({ label, value, accent }) {
  return (
    <div
      className={`
        rounded-xl
        border border-white/5
        bg-white/5
        backdrop-blur
        px-5 py-4
        ${accent ? 'shadow-[0_0_24px_rgba(50,255,195,0.12)]' : ''}
      `}
    >
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-2xl font-semibold text-white mt-1">
        {value}
      </p>
    </div>
  )
}
