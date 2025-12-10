import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useJobCompare, useJobHistory } from '../hooks/useJobs'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { Badge } from '../components/ui/badge'
import { ChangeLabelBadge } from '../components/ChangeLabelBadge'
import { ArrowLeft } from 'lucide-react'

export default function JobCompare() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { data: historyData } = useJobHistory(jobId)
  const timeline = historyData?.timeline || [];
  const versions = timeline
    .map((item) => item.version)
    .filter((v) => v !== null && v !== undefined)
    .sort((a, b) => a - b)

  const [v1, setV1] = useState(versions.length >= 2 ? versions[0] : null)
  const [v2, setV2] = useState(versions.length >= 2 ? versions[versions.length - 1] : null)

  const { data, isLoading, error } = useJobCompare(jobId, v1, v2)

  const handleCompare = () => {
    if (v1 && v2 && v1 !== v2) {
    }
  }

  if (versions.length < 2) {
    return (
      <div className="container mx-auto p-6">
        <Button variant="ghost" onClick={() => navigate(`/jobs/${jobId}/details`)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Details
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600">Not enough versions to compare. Need at least 2 versions.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const compareData = data

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(`/jobs/${jobId}/details`)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Details
        </Button>
        <h1 className="text-3xl font-bold mb-2">Compare Versions</h1>
        <p className="text-gray-600">
          Job ID: <span className="font-mono">{jobId}</span>
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Versions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">From Version</label>
              <select
                value={v1 || ''}
                onChange={(e) => setV1(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {versions.map((v) => (
                  <option key={v} value={v}>
                    Version {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">To Version</label>
              <select
                value={v2 || ''}
                onChange={(e) => setV2(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {versions.map((v) => (
                  <option key={v} value={v}>
                    Version {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleCompare} disabled={!v1 || !v2 || v1 === v2}>
                Compare
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-64" />
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error comparing versions: {error.message || 'Unknown error'}</p>
          </CardContent>
        </Card>
      )}

      {compareData && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Comparison Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Base Version</p>
                  <p className="text-lg font-semibold">v{compareData.baseVersion}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Target Version</p>
                  <p className="text-lg font-semibold">v{compareData.targetVersion}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Change Score</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-lg">
                      {compareData.changeScore?.toFixed(4) || '0.0000'}
                    </Badge>
                    <ChangeLabelBadge label={compareData.changeLabel} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Text Changes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-green-700 mb-2">Added Words ({compareData.diffs?.text?.added?.length || 0})</h3>
                    <div className="flex flex-wrap gap-2">
                      {compareData.diffs?.text?.added?.length > 0 ? (
                        compareData.diffs.text.added.slice(0, 50).map((word, idx) => (
                          <Badge key={idx} variant="success" className="text-xs">
                            {word}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">No words added</span>
                      )}
                      {compareData.diffs?.text?.added?.length > 50 && (
                        <span className="text-xs text-gray-500">... and {compareData.diffs.text.added.length - 50} more</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-red-700 mb-2">Removed Words ({compareData.diffs?.text?.removed?.length || 0})</h3>
                    <div className="flex flex-wrap gap-2">
                      {compareData.diffs?.text?.removed?.length > 0 ? (
                        compareData.diffs.text.removed.slice(0, 50).map((word, idx) => (
                          <Badge key={idx} variant="destructive" className="text-xs">
                            {word}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">No words removed</span>
                      )}
                      {compareData.diffs?.text?.removed?.length > 50 && (
                        <span className="text-xs text-gray-500">... and {compareData.diffs.text.removed.length - 50} more</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Link Changes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-green-700 mb-2">Added Links ({compareData.diffs?.links?.added?.length || 0})</h3>
                    <ul className="space-y-1">
                      {compareData.diffs?.links?.added?.length > 0 ? (
                        compareData.diffs.links.added.map((link, idx) => (
                          <li key={idx} className="text-sm">
                            <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {link}
                            </a>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-gray-500">No links added</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-red-700 mb-2">Removed Links ({compareData.diffs?.links?.removed?.length || 0})</h3>
                    <ul className="space-y-1">
                      {compareData.diffs?.links?.removed?.length > 0 ? (
                        compareData.diffs.links.removed.map((link, idx) => (
                          <li key={idx} className="text-sm">
                            <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {link}
                            </a>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-gray-500">No links removed</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

