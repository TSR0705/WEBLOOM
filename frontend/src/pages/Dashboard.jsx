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
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { Badge } from '../components/ui/badge'
import { ChangeLabelBadge } from '../components/ChangeLabelBadge'
import { Briefcase, Layers, Activity, ShieldCheck, Plus, ExternalLink } from 'lucide-react'

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
        hover:bg-white/[0.02]
        transition-all duration-200
      "
    >
      <TableCell className="font-semibold text-white font-display">
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
          <Badge variant="default">Idle</Badge>
        )}
      </TableCell>

      <TableCell className="max-w-[260px] truncate text-muted-1 font-mono text-xs">
        <span className="flex items-center gap-1">
          {job.url}
          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </span>
      </TableCell>

      <TableCell className="text-white font-mono font-medium">
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

      <TableCell className="text-muted-1 text-xs font-mono">
        {statsLoading ? (
          <Skeleton className="h-4 w-24" />
        ) : stats?.data?.lastRunAt ? (
          new Date(stats.data.lastRunAt).toLocaleString()
        ) : (
          '—'
        )}
      </TableCell>

      <TableCell className="text-white font-mono font-semibold">
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
  const navigate = useNavigate()
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
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-display">
            Dashboard
          </h1>
          <p className="text-muted-1 mt-1 text-sm">
            Live overview of all monitored web jobs
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/jobs/new')}
          className="gap-2 self-start sm:self-auto font-display font-semibold"
        >
          <Plus className="w-4 h-4" />
          Create Job
        </Button>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Jobs" value={jobs.length} icon={Briefcase} />
        <StatCard
          label="Total Versions"
          value={jobs.reduce((sum, j) => sum + (j.totalVersions || 0), 0)}
          icon={Layers}
        />
        <StatCard label="Active Monitoring" value="Live" icon={Activity} accent />
        <StatCard label="System Status" value="Healthy" icon={ShieldCheck} accent />
      </div>

      {/* Jobs Table */}
      <Card className="glass-panel border border-white/5 overflow-hidden">
        <CardHeader className="border-b border-white/5 bg-white/[0.01] py-4">
          <CardTitle className="text-white font-display text-base">
            Tracked Jobs
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-muted-1 font-display font-semibold text-xs">Job</TableHead>
                <TableHead className="text-muted-1 font-display font-semibold text-xs">Status</TableHead>
                <TableHead className="text-muted-1 font-display font-semibold text-xs">URL</TableHead>
                <TableHead className="text-muted-1 font-display font-semibold text-xs">Versions</TableHead>
                <TableHead className="text-muted-1 font-display font-semibold text-xs">Last Change</TableHead>
                <TableHead className="text-muted-1 font-display font-semibold text-xs">Last Run</TableHead>
                <TableHead className="text-muted-1 font-display font-semibold text-xs">Avg Score</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-2 py-12"
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
function StatCard({ label, value, icon: Icon, accent }) {
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
