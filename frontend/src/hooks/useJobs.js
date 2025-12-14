import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { jobsApi } from "../api/jobs"

/* -------------------------
   READ QUERIES (Phase 8)
-------------------------- */

export function useJobs() {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: jobsApi.getAll,
  })
}

export function useJob(jobId) {
  return useQuery({
    queryKey: ["job", jobId],
    queryFn: () => jobsApi.getById(jobId),
    enabled: !!jobId,
  })
}

export function useJobStats(jobId) {
  return useQuery({
    queryKey: ["job-stats", jobId],
    queryFn: () => jobsApi.getStats(jobId),
    enabled: !!jobId,
  })
}

export function useJobHistory(jobId) {
  return useQuery({
    queryKey: ["job-history", jobId],
    queryFn: () => jobsApi.getHistory(jobId),
    enabled: !!jobId,
  })
}

export function useJobVersion(jobId, version) {
  return useQuery({
    queryKey: ["job-version", jobId, version],
    queryFn: () => jobsApi.getVersion(jobId, version),
    enabled: !!jobId && !!version,
  })
}

export function useJobCompare(jobId, v1, v2) {
  return useQuery({
    queryKey: ["job-compare", jobId, v1, v2],
    queryFn: () => jobsApi.compare(jobId, v1, v2),
    enabled: !!jobId && !!v1 && !!v2,
  })
}

/* -------------------------
   MUTATIONS (Phase 9B)
-------------------------- */

/**
 * Create a new monitoring job
 * Payload: { name, url }
 */
export function useCreateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: jobsApi.create, // POST /jobs
    onSuccess: () => {
      // Refresh dashboard list
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
    },
  })
}

/**
 * Manually trigger a job run
 */
export function useRunJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ jobId }) => jobsApi.run(jobId), // POST /jobs/:id/run
    onSuccess: (_, { jobId }) => {
      // Refresh everything related to that job
      queryClient.invalidateQueries({ queryKey: ["job-history", jobId] })
      queryClient.invalidateQueries({ queryKey: ["job-stats", jobId] })
    },
  })
}
