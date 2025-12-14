import { useParams, useNavigate } from 'react-router-dom'
import { useJobVersion } from '../hooks/useJobs'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { ArrowLeft, ExternalLink, FileCode, Link as LinkIcon } from 'lucide-react'

export default function JobVersion() {
  const { jobId, version } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = useJobVersion(jobId, Number(version))

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40" />
        <Skeleton className="h-[520px]" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="bg-white/5 border border-white/5">
        <CardContent className="pt-6">
          <p className="text-red-400">
            Failed to load version data
          </p>
          {/* <Button
            variant="ghost"
            className="mt-4"
            onClick={() => navigate(`/jobs/${jobId}/history`)}
          >
            Back to History
          </Button> */}
           <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="text-gray-400 hover:text-[#32FFC3] w-fit"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
        </CardContent>
      </Card>
    )
  }

  const parsed = data.parsed || {}
  const links = parsed.links || []
  const textLength = parsed.text?.length || 0

  return (
    <div className="space-y-10">
      {/* Back */}
      {/* <Button
        variant="ghost"
        onClick={() => navigate(`/jobs/${jobId}/history`)}
        className="text-gray-400 hover:text-[#32FFC3] w-fit"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to History
      </Button> */}
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
          Version {version}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Captured at{' '}
          {data.createdAt
            ? new Date(data.createdAt).toLocaleString()
            : 'Unknown time'}
        </p>
      </div>

      {/* Parsed Intelligence */}
      <Card className="bg-white/5 border border-white/5 backdrop-blur">
        <CardContent className="py-6 space-y-6">
          <div className="flex items-center gap-3 text-[#32FFC3]">
            <FileCode className="w-5 h-5" />
            <h2 className="text-lg font-medium text-white">
              Parsed Intelligence
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-400">Title</p>
              <p className="text-sm text-gray-200 mt-1">
                {parsed.title || '—'}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400">Description</p>
              <p className="text-sm text-gray-200 mt-1">
                {parsed.description || '—'}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400">Text Length</p>
              <p className="text-sm text-gray-200 mt-1">
                {textLength.toLocaleString()} characters
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400">Links Detected</p>
              <p className="text-sm text-gray-200 mt-1">
                {links.length}
              </p>
            </div>
          </div>

          {links.length > 0 && (
            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 text-gray-300 mb-3">
                <LinkIcon className="w-4 h-4" />
                <span className="text-sm">Extracted Links</span>
              </div>

              <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {links.slice(0, 12).map((link, idx) => (
                  <li key={idx}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                        text-sm text-gray-400
                        hover:text-[#32FFC3]
                        flex items-center gap-1
                      "
                    >
                      {link.text || link.href}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                ))}
                {links.length > 12 && (
                  <li className="text-xs text-gray-500">
                    +{links.length - 12} more links
                  </li>
                )}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Raw HTML */}
      <Card className="bg-white/5 border border-white/5 backdrop-blur">
        <CardContent className="py-6 space-y-4">
          <h2 className="text-lg font-medium text-white">
            Raw HTML Artifact
          </h2>

          {data.html ? (
            <iframe
              sandbox="allow-same-origin"
              srcDoc={data.html}
              title={`Version ${version} HTML`}
              className="
                w-full
                rounded-lg
                border border-white/10
                bg-transparent
              "
              style={{ 
                height: '600px',
                backgroundColor: 'transparent !important'
              }}
              onLoad={(e) => {
                // Remove any inherited background styles
                try {
                  e.target.contentDocument.body.style.backgroundColor = 'transparent';
                  e.target.contentDocument.documentElement.style.backgroundColor = 'transparent';
                } catch (err) {
                  // Cross-origin restrictions may prevent this
                }
              }}
            />
          ) : (
            <p className="text-sm text-gray-500">
              No HTML snapshot available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}