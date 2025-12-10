import { useParams, useNavigate } from 'react-router-dom'
import { useJobVersion } from '../hooks/useJobs'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { ArrowLeft, ExternalLink } from 'lucide-react'

export default function JobVersion() {
  const { jobId, version } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = useJobVersion(jobId, parseInt(version))

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 mb-4" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading version: {error.message || 'Unknown error'}</p>
            <Button className="mt-4" onClick={() => navigate(`/jobs/${jobId}/history`)}>
              Back to History
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600">Version not found</p>
            <Button className="mt-4" onClick={() => navigate(`/jobs/${jobId}/history`)}>
              Back to History
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const versionData = data
  const parsed = versionData.parsed || {}
  const links = parsed.links || []
  const textLength = parsed.text?.length || 0

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(`/jobs/${jobId}/history`)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to History
        </Button>
        <h1 className="text-3xl font-bold mb-2">Version {version}</h1>
        <p className="text-gray-600">
          Created: {versionData.createdAt ? new Date(versionData.createdAt).toLocaleString() : 'N/A'}
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Parsed Data</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Title</dt>
              <dd className="mt-1 text-sm text-gray-900">{parsed.title || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">{parsed.description || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Links Count</dt>
              <dd className="mt-1 text-sm text-gray-900">{links.length}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Text Length</dt>
              <dd className="mt-1 text-sm text-gray-900">{textLength.toLocaleString()} characters</dd>
            </div>
          </dl>

          {links.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Links</h3>
              <ul className="space-y-2">
                {links.slice(0, 10).map((link, idx) => (
                  <li key={idx} className="text-sm">
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {link.text || link.href}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
                {links.length > 10 && <li className="text-sm text-gray-500">... and {links.length - 10} more</li>}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raw HTML</CardTitle>
        </CardHeader>
        <CardContent>
          {versionData.html ? (
            <iframe
              sandbox="allow-same-origin"
              srcDoc={versionData.html}
              className="w-full border border-gray-200 rounded-md"
              style={{ height: '600px' }}
              title={`Version ${version} HTML`}
            />
          ) : (
            <p className="text-gray-500">No HTML content available</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

