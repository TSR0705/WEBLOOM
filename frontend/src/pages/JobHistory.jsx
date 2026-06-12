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
    maintainAspectRatio: false,
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
    <div className="space-y-8">
      {/* Back */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="text-muted-1 hover:text-white font-display font-medium text-xs px-2 h-8"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight font-display">
          History Timeline
        </h1>
        <p className="text-muted-1 mt-1 text-sm">
          Evolution of content changes over time
        </p>
        
        {/* Info panel */}
        <div className="mt-5 p-5 glass-panel border border-white/5 rounded-xl">
          <h2 className="text-sm font-semibold text-white mb-2 font-display uppercase tracking-wider">Enhanced Change Detection</h2>
          <p className="text-xs text-muted-1 leading-relaxed">
            Our advanced algorithm analyzes multiple factors including text content, word structure, 
            titles, descriptions, and link structures to provide accurate change detection.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <ChangeLabelBadge label="negligible" />
              <span className="text-[11px] text-muted-1">Minimal (0-5%)</span>
            </div>
            <div className="flex items-center gap-2">
              <ChangeLabelBadge label="low" />
              <span className="text-[11px] text-muted-1">Low (5-15%)</span>
            </div>
            <div className="flex items-center gap-2">
              <ChangeLabelBadge label="medium" />
              <span className="text-[11px] text-muted-1">Medium (15-35%)</span>
            </div>
            <div className="flex items-center gap-2">
              <ChangeLabelBadge label="high" />
              <span className="text-[11px] text-muted-1">High (35-70%)</span>
            </div>
            <div className="flex items-center gap-2">
              <ChangeLabelBadge label="significant" />
              <span className="text-[11px] text-muted-1">Significant (70-100%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      {scored.length > 0 && (
        <Card className="glass-panel border-white/5 overflow-hidden">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-white mb-1 font-display">Enhanced Change Detection Trend</h2>
            <p className="text-xs text-muted-1 mb-6">Multi-dimensional analysis of content evolution with improved accuracy</p>
            <div className="bg-white/[0.01] rounded-xl p-4 border border-white/5 h-[200px]">
              <Line data={chartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <div className="relative space-y-6 pb-12">
        {/* Vertical axis */}
        <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-white/10" />

        {timeline.length === 0 ? (
          <Card className="glass-panel border-white/5">
            <CardContent className="py-12 text-center text-muted-2 text-sm">
              No history available
            </CardContent>
          </Card>
        ) : (
          timeline.map((item, index) => {
            // Enhanced intensity visualization based on new change labels
            const intensity =
              item.analysisLabel === 'significant'
                ? 'border-red-500/30 shadow-[0_0_16px_rgba(255,78,102,0.05)]'
                : item.analysisLabel === 'high'
                ? 'border-[#FF8E5E]/20'
                : item.analysisLabel === 'medium'
                ? 'border-yellow-500/20'
                : item.analysisLabel === 'low'
                ? 'border-green-500/20'
                : item.analysisLabel === 'negligible'
                ? 'border-gray-500/20'
                : item.analysisScore === null
                ? 'border-gray-500/10'
                : 'border-white/5'

            return (
              <div key={index} className="relative pl-12 group">
                {/* Node */}
                <div
                  className={`
                    absolute left-[10px] top-[26px] z-10
                    w-[12px] h-[12px] rounded-full border-2 border-[#030508]
                    transition-all duration-300 group-hover:scale-125
                    ${item.analysisLabel === 'significant' ? 'bg-[#FF4E66] shadow-[0_0_10px_rgba(255,78,102,0.6)]' : 
                      item.analysisLabel === 'high' ? 'bg-[#FF8E5E] shadow-[0_0_10px_rgba(255,142,94,0.4)]' : 
                      item.analysisLabel === 'medium' ? 'bg-[#FFC35E] shadow-[0_0_10px_rgba(255,195,94,0.4)]' : 
                      item.analysisLabel === 'low' ? 'bg-[#32FFC3] shadow-[0_0_10px_rgba(50,255,195,0.4)]' : 
                      item.analysisLabel === 'negligible' ? 'bg-gray-500' : 
                      item.analysisScore === null ? 'bg-gray-400' : 
                      'bg-[#32FFC3]'}
                  `}
                />

                <Card
                  className={`
                    glass-panel
                    border ${intensity}
                    group-hover:border-[#32FFC3]/30
                    group-hover:translate-x-[3px]
                    transition-all duration-300
                  `}
                >
                  <CardContent className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-bold text-white font-display">
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

                      <div className="flex items-center gap-2 text-xs text-muted-1 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleString()
                          : 'No timestamp'}
                      </div>

                      {item.analysisScore != null && (
                        <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                          <div className="flex items-center gap-2 text-xs">
                            <Activity className="w-3.5 h-3.5 text-[#32FFC3]" />
                            <span className="text-muted-1">
                              Change score:
                            </span>
                            <span className="text-[#32FFC3] font-mono font-bold">
                              {(item.analysisScore * 100).toFixed(2)}%
                            </span>
                          </div>
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
                        className="font-display font-medium self-start sm:self-auto"
                      >
                        Inspect Version
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
