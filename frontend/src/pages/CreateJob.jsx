import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { jobsApi } from "../api/jobs"

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
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Hero */}
      <div>
        <h1 className="text-3xl font-semibold text-white">
          Create Monitoring Job
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Start tracking changes on any webpage in real time
        </p>
      </div>

      {/* Form */}
      <Card className="bg-white/5 border border-white/5 backdrop-blur">
        <CardHeader>
          <CardTitle>Job Configuration</CardTitle>
          <CardDescription>
            Define what Webloom should monitor
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Name */}
            <div className="space-y-1">
              <label className="text-sm text-gray-400">
                Job Name (optional)
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Amazon Price Tracker"
              />
            </div>

            {/* URL */}
            <div className="space-y-1">
              <label className="text-sm text-gray-400">
                Target URL *
              </label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-400">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={loading}>
                {loading ? "Creating…" : "Create Job"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}