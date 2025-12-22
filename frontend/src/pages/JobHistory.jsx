import { useParams, useNavigate } from 'react-router-dom'
import { useJobHistory } from '../hooks/useJobs'
import { Card, CardContent } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { ChangeLabelBadge } from '../components/ChangeLabelBadge'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
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
        label: 'Change Score',
        data: scored.map((i) => i.analysisScore),
        borderColor: (context) => {
          const index = context.dataIndex;
          const score = context.dataset.data[index];
          const label = scored[index]?.analysisLabel;
          
          if (label === 'significant') return '#FF4E66';
          if (label === 'high') return '#FF8E5E';
          if (label === 'medium') return '#FFC35E';
          if (label === 'low') return '#32FFC3';
          if (label === 'negligible') return '#AAAAAA';
          return '#32FFC3';
        },
        backgroundColor: (context) => {
          const index = context.dataIndex;
          const label = scored[index]?.analysisLabel;
          
          if (label === 'significant') return 'rgba(255,78,102,0.15)';
          if (label === 'high') return 'rgba(255,142,94,0.15)';
          if (label === 'medium') return 'rgba(255,195,94,0.15)';
          if (label === 'low') return 'rgba(50,255,195,0.15)';
          if (label === 'negligible') return 'rgba(170,170,170,0.15)';
          return 'rgba(50,255,195,0.06)';
        },
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: (context) => {
          const index = context.dataIndex;
          const label = scored[index]?.analysisLabel;
          
          if (label === 'significant') return '#FF4E66';
          if (label === 'high') return '#FF8E5E';
          if (label === 'medium') return '#FFC35E';
          if (label === 'low') return '#32FFC3';
          if (label === 'negligible') return '#AAAAAA';
          return '#32FFC3';
        },
        pointBorderColor: '#0C0F14',
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: { 
        display: true,
        position: 'top',
        labels: {
          color: '#9BA2B0',
          font: {
            size: 12
          },
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: '#0C0F14',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        titleColor: '#fff',
        bodyColor: '#9BA2B0',
        callbacks: {
          title: (items) => {
            const index = items[0].dataIndex;
            const item = scored[index];
            return `Version ${item.version}`;
          },
          label: (context) => {
            const index = context.dataIndex;
            const item = scored[index];
            return [
              `Change Score: ${(item.analysisScore * 100).toFixed(2)}%`,
              `Change Type: ${item.analysisLabel || 'N/A'}`,
              `Timestamp: ${new Date(item.createdAt).toLocaleString()}`
            ];
          }
        }
      },
    },
    scales: {
      x: {
        ticks: { color: '#9BA2B0' },
        grid: { 
          display: false,
          drawBorder: false
        },
      },
      y: {
        beginAtZero: true,
        max: 1,
        min: 0,
        ticks: { 
          color: '#9BA2B0',
          callback: function(value) {
            return (value * 100).toFixed(0) + '%';
          }
        },
        grid: { 
          color: 'rgba(255,255,255,0.04)',
          drawBorder: false
        },
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
        <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg">
          <h2 className="text-lg font-medium text-white mb-2">Enhanced Change Detection</h2>
          <p className="text-sm text-gray-400">
            Our advanced algorithm analyzes multiple factors including text content, word structure, 
            titles, descriptions, and link structures to provide accurate change detection.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <ChangeLabelBadge label="negligible" />
            <span className="text-xs text-gray-400 self-center">Minimal changes (0-5%)</span>
            <ChangeLabelBadge label="low" />
            <span className="text-xs text-gray-400 self-center">Low changes (5-15%)</span>
            <ChangeLabelBadge label="medium" />
            <span className="text-xs text-gray-400 self-center">Medium changes (15-35%)</span>
            <ChangeLabelBadge label="high" />
            <span className="text-xs text-gray-400 self-center">High changes (35-70%)</span>
            <ChangeLabelBadge label="significant" />
            <span className="text-xs text-gray-400 self-center">Significant changes (70-100%)</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      {scored.length > 0 && (
        <Card className="bg-white/5 border border-white/5 backdrop-blur">
          <CardContent className="pt-6">
            <h2 className="text-xl font-medium text-white mb-4">Enhanced Change Detection Trend</h2>
            <p className="text-sm text-gray-400 mb-4">Multi-dimensional analysis of content evolution with improved accuracy</p>
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
            // Enhanced intensity visualization based on new change labels
            const intensity =
              item.analysisLabel === 'significant'
                ? 'border-red-500/50 shadow-[0_0_16px_rgba(255,78,102,0.3)]'
                : item.analysisLabel === 'high'
                ? 'border-red-500/30'
                : item.analysisLabel === 'medium'
                ? 'border-yellow-500/30'
                : item.analysisLabel === 'low'
                ? 'border-green-500/30'
                : item.analysisLabel === 'negligible'
                ? 'border-gray-500/20'
                : item.analysisScore === null
                ? 'border-gray-500/10'
                : 'border-white/10'

            return (
              <div key={index} className="relative pl-12">
                {/* Node */}
                <div
                  className={`
                    absolute left-2 top-6
                    w-4 h-4 rounded-full
                    ${item.analysisLabel === 'significant' ? 'bg-[#FF4E66]' : 
                      item.analysisLabel === 'high' ? 'bg-[#FF8E5E]' : 
                      item.analysisLabel === 'medium' ? 'bg-[#FFC35E]' : 
                      item.analysisLabel === 'low' ? 'bg-[#32FFC3]' : 
                      item.analysisLabel === 'negligible' ? 'bg-gray-500' : 
                      item.analysisScore === null ? 'bg-gray-400' : 
                      'bg-[#32FFC3]'}
                    ${item.analysisLabel === 'significant' ? 'shadow-[0_0_16px_rgba(255,78,102,0.7)]' : 
                      item.analysisLabel === 'high' ? 'shadow-[0_0_16px_rgba(255,142,94,0.5)]' : 
                      item.analysisLabel === 'medium' ? 'shadow-[0_0_16px_rgba(255,195,94,0.5)]' : 
                      item.analysisLabel === 'low' ? 'shadow-[0_0_16px_rgba(50,255,195,0.5)]' : 
                      item.analysisLabel === 'negligible' ? 'shadow-[0_0_16px_rgba(128,128,128,0.3)]' : 
                      item.analysisScore === null ? 'shadow-[0_0_16px_rgba(128,128,128,0.3)]' : 
                      'shadow-[0_0_16px_rgba(50,255,195,0.5)]'}
                  `}
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
                        {item.status && (
                          <Badge variant={
                            item.status === 'completed' ? 'success' :
                            item.status === 'failed' ? 'destructive' :
                            item.status === 'running' ? 'success' :
                            'warning'
                          }>
                            {item.status}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock className="w-4 h-4" />
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleString()
                          : 'No timestamp'}
                      </div>

                      {item.analysisScore != null && (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Activity className="w-4 h-4 text-[#32FFC3]" />
                            <span className="text-gray-300">
                              Change score:
                            </span>
                            <span className="text-[#32FFC3] font-medium">
                              {item.analysisScore.toFixed(4)}
                            </span>
                          </div>
                          {item.analysisLabel && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-300">
                                Change type:
                              </span>
                              <ChangeLabelBadge label={item.analysisLabel} />
                            </div>
                          )}
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
