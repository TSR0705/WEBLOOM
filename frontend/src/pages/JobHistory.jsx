import { useParams, useNavigate } from 'react-router-dom'
import { useJobHistory } from '../hooks/useJobs'
import { Card, CardContent } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { ChangeLabelBadge } from '../components/ChangeLabelBadge'
import { Button } from '../components/ui/button'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function JobHistory() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = useJobHistory(jobId)

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading history: {error.message || 'Unknown error'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const historyData = data || {};
  const timeline = historyData.timeline || [];


  const chartData = {
    labels: timeline
      .filter((item) => item.version !== null && item.analysisScore !== null)
      .map((item) => `v${item.version}`),
    datasets: [
      {
        label: 'Change Score',
        data: timeline
          .filter((item) => item.version !== null && item.analysisScore !== null)
          .map((item) => item.analysisScore),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Change Score Over Versions',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
      },
    },
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Job History</h1>
        <p className="text-gray-600">
          Job ID: <span className="font-mono">{jobId}</span>
        </p>
        {historyData.url && (
          <p className="text-gray-600">
            URL: <a href={historyData.url} className="text-blue-600 hover:underline">{historyData.url}</a>
          </p>
        )}
      </div>

      {timeline.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Line data={chartData} options={chartOptions} />
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {timeline.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500 py-8">No history available for this job.</p>
            </CardContent>
          </Card>
        ) : (
          timeline.map((item, index) => (
            <Card key={index} className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg" />
              <CardContent className="pt-6 pl-8">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">Version {item.version ?? 'N/A'}</h3>
                      <ChangeLabelBadge label={item.analysisLabel} />
                      {item.status && (
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            item.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'No timestamp'}
                    </p>
                    {item.analysisScore !== null && (
                      <p className="text-sm text-gray-700">
                        Change Score: <span className="font-medium">{item.analysisScore.toFixed(4)}</span>
                      </p>
                    )}
                    {item.analysisStatus && (
                      <p className="text-sm text-gray-700">Analysis Status: {item.analysisStatus}</p>
                    )}
                  </div>
                  {item.version && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/jobs/${jobId}/version/${item.version}`)}
                    >
                      View Version
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

