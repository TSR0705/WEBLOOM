import { useNavigate } from 'react-router-dom'
import { useJobs, useJobStats, useJobHistory } from '../hooks/useJobs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { ChangeLabelBadge } from '../components/ChangeLabelBadge'

function DashboardRow({ job }) {
  const navigate = useNavigate()
  const { data: stats, isLoading: statsLoading } = useJobStats(job._id.toString())
  const { data: history } = useJobHistory(job._id.toString())

  const handleClick = () => {
    navigate(`/jobs/${job._id}/details`)
  }

  const timeline = history?.data?.timeline || []
  const lastChange = timeline.length > 0 ? timeline[timeline.length - 1] : null
  const lastChangeLabel = lastChange?.analysisLabel || null
  const avgScore = stats?.data?.avgScore ?? null
  const totalVersions = stats?.data?.totalVersions ?? 0
  const lastRunAt = stats?.data?.lastRunAt ? new Date(stats.data.lastRunAt).toLocaleString() : 'Never'

  return (
    <TableRow className="cursor-pointer hover:bg-gray-50" onClick={handleClick}>
      <TableCell className="font-medium">{job.name || 'Unnamed Job'}</TableCell>
      <TableCell>
        <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          {job.url}
        </a>
      </TableCell>
      <TableCell>{statsLoading ? <Skeleton className="h-4 w-8" /> : totalVersions}</TableCell>
      <TableCell>
        {statsLoading ? <Skeleton className="h-6 w-16" /> : <ChangeLabelBadge label={lastChangeLabel} />}
      </TableCell>
      <TableCell>{statsLoading ? <Skeleton className="h-4 w-24" /> : lastRunAt}</TableCell>
      <TableCell>
        {statsLoading ? (
          <Skeleton className="h-4 w-12" />
        ) : avgScore !== null ? (
          avgScore.toFixed(3)
        ) : (
          '-'
        )}
      </TableCell>
    </TableRow>
  )
}

export default function Dashboard() {
  const { data, isLoading, error } = useJobs()

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <Card>
          <CardHeader>
            <CardTitle>Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading jobs: {error.message || 'Unknown error'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const jobs = Array.isArray(data) ? data : []

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Total Versions</TableHead>
                <TableHead>Last Change Label</TableHead>
                <TableHead>Last Run Time</TableHead>
                <TableHead>Average Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No jobs found. Create a job to get started.
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => <DashboardRow key={job._id.toString()} job={job} />)
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

