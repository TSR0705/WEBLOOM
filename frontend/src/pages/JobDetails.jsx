import { useParams, useNavigate } from 'react-router-dom'
import { useJob, useJobStats } from '../hooks/useJobs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { StatsCard } from '../components/StatsCard'
import { Activity, Clock, TrendingUp, FileText } from 'lucide-react'

export default function JobDetails() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { data: job, isLoading: jobLoading, error: jobError } = useJob(jobId)
  const { data: stats, isLoading: statsLoading, error: statsError } = useJobStats(jobId)

  if (jobLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (jobError) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading job: {jobError.message || 'Unknown error'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600">Job not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statsData = stats?.data || {}
  const latestVersion = statsData.totalVersions || 0

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{job.name || 'Unnamed Job'}</h1>
        <p className="text-gray-600">
          <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {job.url}
          </a>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Versions"
          value={statsLoading ? '-' : statsData.totalVersions || 0}
          icon={FileText}
        />
        <StatsCard
          title="High Changes"
          value={statsLoading ? '-' : statsData.highCount || 0}
          description="Significant changes detected"
          icon={TrendingUp}
        />
        <StatsCard
          title="Average Score"
          value={statsLoading ? '-' : statsData.avgScore ? statsData.avgScore.toFixed(3) : '0.000'}
          icon={Activity}
        />
        <StatsCard
          title="Last Run"
          value={
            statsLoading
              ? '-'
              : statsData.lastRunAt
              ? new Date(statsData.lastRunAt).toLocaleDateString()
              : 'Never'
          }
          icon={Clock}
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Manage and view job data</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button onClick={() => navigate(`/jobs/${jobId}/history`)}>View History</Button>
          <Button variant="outline" onClick={() => navigate(`/jobs/${jobId}/compare`)}>
            Compare Versions
          </Button>
          {latestVersion > 0 && (
            <Button variant="outline" onClick={() => navigate(`/jobs/${jobId}/version/${latestVersion}`)}>
              View Latest Version
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Job Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Job ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{job._id?.toString() || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Schedule</dt>
              <dd className="mt-1 text-sm text-gray-900">{job.schedule || 'Not scheduled'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {job.createdAt ? new Date(job.createdAt).toLocaleString() : 'N/A'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">First Run</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {statsData.firstRunAt ? new Date(statsData.firstRunAt).toLocaleString() : 'Never'}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

