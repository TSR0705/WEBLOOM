import { useParams, useNavigate } from 'react-router-dom'
import { useJobHistory } from '../hooks/useJobs'
import { Card, CardContent } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { ChangeLabelBadge } from '../components/ChangeLabelBadge'
import { Button } from '../components/ui/button'
import { ArrowLeft, Clock, Activity } from 'lucide-react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip)

export default function JobHistory() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = useJobHistory(jobId)

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-white/5 border border-white/5">
        <CardContent className="pt-6 text-red-400">
          Failed to load job history
        </CardContent>
      </Card>
    )
  }

  const timeline = data?.timeline || []

  const scored = timeline.filter(
    (i) => i.version != null && i.analysisScore != null
  )

  const chartData = {
    labels: scored.map((i) => `v${i.version}`),
    datasets: [
      {
        data: scored.map((i) => i.analysisScore),
        borderColor: '#32FFC3',
        backgroundColor: 'rgba(50,255,195,0.06)',
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#32FFC3',
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0C0F14',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        titleColor: '#fff',
        bodyColor: '#9BA2B0',
      },
    },
    scales: {
      x: {
        ticks: { color: '#6B7280' },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        max: 1,
        ticks: { color: '#6B7280' },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
    },
  }

  return (
    <div className="space-y-12">
      {/* Back */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="text-gray-400 hover:text-[#32FFC3] w-fit"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-white">
          History Timeline
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Evolution of content changes over time
        </p>
      </div>

      {/* Chart */}
      {scored.length > 0 && (
        <Card className="bg-white/5 border border-white/5 backdrop-blur">
          <CardContent className="pt-6">
            <Line data={chartData} options={chartOptions} />
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <div className="relative space-y-6">
        {/* Vertical axis */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />

        {timeline.length === 0 ? (
          <Card className="bg-white/5 border border-white/5">
            <CardContent className="py-10 text-center text-gray-500">
              No history available
            </CardContent>
          </Card>
        ) : (
          timeline.map((item, index) => {
            const intensity =
              item.analysisScore >= 0.7
                ? 'border-red-500/30'
                : item.analysisScore >= 0.3
                ? 'border-yellow-500/30'
                : 'border-white/10'

            return (
              <div key={index} className="relative pl-12">
                {/* Node */}
                <div
                  className="
                    absolute left-2 top-6
                    w-4 h-4 rounded-full
                    bg-[#32FFC3]
                    shadow-[0_0_16px_rgba(50,255,195,0.5)]
                  "
                />

                <Card
                  className={`
                    bg-white/5
                    backdrop-blur
                    border ${intensity}
                    hover:border-[#32FFC3]/40
                    transition
                  `}
                >
                  <CardContent className="py-5 flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium text-white">
                          Version {item.version ?? '—'}
                        </h3>
                        <ChangeLabelBadge label={item.analysisLabel} />
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock className="w-4 h-4" />
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleString()
                          : 'No timestamp'}
                      </div>

                      {item.analysisScore != null && (
                        <div className="flex items-center gap-2 text-sm">
                          <Activity className="w-4 h-4 text-[#32FFC3]" />
                          <span className="text-gray-300">
                            Change score:
                          </span>
                          <span className="text-[#32FFC3] font-medium">
                            {item.analysisScore.toFixed(4)}
                          </span>
                        </div>
                      )}
                    </div>

                    {item.version && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(`/jobs/${jobId}/version/${item.version}`)
                        }
                      >
                        Inspect
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
