import { useParams, useNavigate } from 'react-router-dom'
import { useJobVersion } from '../hooks/useJobs'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
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
          Version {version}
        </h1>
        <p className="text-muted-1 mt-1 text-sm font-mono">
          Captured at{' '}
          {data.createdAt
            ? new Date(data.createdAt).toLocaleString()
            : 'Unknown time'}
        </p>
      </div>

      {/* Parsed Intelligence */}
      <Card className="glass-panel border-white/5 overflow-hidden">
        <CardHeader className="border-b border-white/5 bg-white/[0.01] py-4">
          <div className="flex items-center gap-3 text-[#32FFC3]">
            <FileCode className="w-5 h-5" />
            <CardTitle className="text-white font-display text-base">
              Parsed Intelligence
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Meta label="Title" value={parsed.title || '—'} />
            <Meta label="Description" value={parsed.description || '—'} />
            <Meta label="Text Length" value={`${textLength.toLocaleString()} characters`} />
            <Meta label="Links Detected" value={links.length} />
          </div>

          {links.length > 0 && (
            <div className="pt-6 border-t border-white/5">
              <div className="flex items-center gap-2 text-white font-display font-semibold text-sm mb-4">
                <LinkIcon className="w-4 h-4 text-[#32FFC3]" />
                <span>Extracted Links</span>
              </div>

              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-2 bg-[#030508]/40 p-4 rounded-xl border border-white/5">
                {links.slice(0, 30).map((link, idx) => (
                  <li key={idx} className="group">
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                        text-xs text-muted-1
                        hover:text-[#32FFC3]
                        flex items-center justify-between gap-1.5 truncate
                        bg-white/[0.01] border border-white/5 rounded-lg px-3 py-2
                        transition-all duration-200 hover:-translate-y-[1px]
                      "
                    >
                      <span className="truncate flex-1">{link.text || link.href}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 shrink-0 text-[#32FFC3]" />
                    </a>
                  </li>
                ))}
                {links.length > 30 && (
                  <li className="text-[10px] text-muted-2 font-mono col-span-2 pt-2 text-center">
                    +{links.length - 30} more links detected in page structure
                  </li>
                )}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Raw HTML */}
      <Card className="glass-panel border-white/5 overflow-hidden">
        <CardHeader className="border-b border-white/5 bg-white/[0.01] py-4">
          <CardTitle className="text-white font-display text-base">
            Raw HTML Artifact
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {data.html ? (
            <iframe
              sandbox="allow-same-origin"
              srcDoc={data.html}
              title={`Version ${version} HTML`}
              className="
                w-full
                rounded-xl
                border border-white/5
                bg-[#030508]/20
              "
              style={{ 
                height: '600px',
              }}
              onLoad={(e) => {
                try {
                  e.target.contentDocument.body.style.backgroundColor = 'transparent';
                  e.target.contentDocument.documentElement.style.backgroundColor = 'transparent';
                } catch (err) {
                  // Ignore cross-origin warnings
                }
              }}
            />
          ) : (
            <p className="text-xs text-muted-2 font-mono py-6 text-center">
              No HTML snapshot available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Meta({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-1 font-display">{label}</p>
      <p className="text-sm text-white font-mono break-all bg-white/[0.01] border border-white/5 rounded-lg px-3 py-2">{value}</p>
    </div>
  )
}