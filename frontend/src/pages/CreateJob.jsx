import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { jobsApi } from "../api/jobs"
import { ArrowLeft } from "lucide-react"

export default function CreateJob() {
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!url.trim()) {
      setError("Target URL is required")
      return
    }

    try {
      setLoading(true)
      const res = await jobsApi.create({
        name: name || "Untitled Job",
        url: url.trim(),
      })

      const jobId = res.jobId || res._id || res?.data?._id

      if (!jobId) {
        throw new Error("Invalid create job response")
      }

      navigate(`/jobs/${jobId}/details`)
    } catch (err) {
      setError(err?.message || "Failed to create job")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="text-muted-1 hover:text-white font-display font-medium text-xs px-2 h-8"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Cancel & Back
      </Button>

      {/* Hero Header */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight font-display">
          Create Monitoring Job
        </h1>
        <p className="text-muted-1 mt-1 text-sm">
          Start tracking changes on any webpage in real time
        </p>
      </div>

      {/* Form Card */}
      <Card className="glass-panel border-white/5 overflow-hidden">
        <CardHeader className="border-b border-white/5 bg-white/[0.01] py-5">
          <CardTitle className="text-white font-display text-base">Job Configuration</CardTitle>
          <CardDescription className="text-muted-1 text-xs">
            Define what Webloom should monitor
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-1 font-display">
                Job Name (optional)
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Amazon Price Tracker"
                className="bg-white/[0.02] border-white/10 text-white placeholder:text-gray-600 focus:border-[#32FFC3]/50 focus:ring-[#32FFC3]/10"
              />
            </div>

            {/* URL */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-1 font-display">
                Target URL *
              </label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
                className="bg-white/[0.02] border-white/10 text-white placeholder:text-gray-600 focus:border-[#32FFC3]/50 focus:ring-[#32FFC3]/10 font-mono text-sm"
              />
            </div>

            {error && (
              <p className="text-xs text-[#FF4E66] font-mono font-medium">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate(-1)}
                className="font-display font-medium text-sm"
              >
                Cancel
              </Button>

              <Button 
                type="submit" 
                disabled={loading} 
                variant="primary"
                className="font-display font-semibold text-sm"
              >
                {loading ? "Creating…" : "Create Job"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}