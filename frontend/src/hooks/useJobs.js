import React from "react"
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
  // PHASE 9C FIX: Explicit shouldPoll state to control polling
  // This fixes the stale data problem where refetchInterval couldn't
  // reliably detect when to start/stop polling
  const [shouldPoll, setShouldPoll] = React.useState(false);

  const query = useQuery({
    queryKey: ["job-stats", jobId],
    queryFn: () => jobsApi.getStats(jobId),
    enabled: !!jobId,
    // Poll every 3 seconds ONLY when shouldPoll is true
    // When false, polling stops completely (refetchInterval: false)
    refetchInterval: shouldPoll ? 3000 : false,
    // Continue polling even if user switches tabs
    refetchIntervalInBackground: true,
  });

  // Effect: Monitor activeRun status and control polling
  // Runs whenever activeRun.status changes (from mutation or polling)
  React.useEffect(() => {
    const activeRun = query.data?.data?.activeRun;
    // Start polling if activeRun exists and status is not final
    const isActive =
      activeRun && !["completed", "failed"].includes(activeRun.status);
    setShouldPoll(isActive);
  }, [query.data?.data?.activeRun?.status]);

  return query;
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
