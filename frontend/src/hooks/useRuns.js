import { useMutation, useQueryClient } from "@tanstack/react-query";
import { runsApi } from "../api/runs";

/**
 * PHASE 9C FIX: Why the previous implementation failed:
 *
 * ❌ OLD PROBLEM:
 * 1. User clicks "Run Now" → mutation succeeds
 * 2. onSuccess: invalidateQueries(["job-stats", jobId])
 * 3. BUT: refetchInterval function checked stale data
 * 4. Polling never started because activeRun didn't exist in stale cache
 * 5. UI remained frozen until manual refresh
 *
 * ✅ NEW SOLUTION:
 * 1. onMutate: Show optimistic "Queued" immediately
 * 2. onSuccess: Invalidate caches → triggers refetch
 * 3. After refetch: useJobStats effect detects activeRun
 * 4. Effect enables shouldPoll state → polling starts at 3-sec intervals
 * 5. Every 3 seconds: Real status updates flow through (Queued → Running → Completed)
 * 6. Polling auto-stops when status is final
 *
 * KEY INSIGHT: 
 * refetchInterval function can't control itself based on data it's observing.
 * We use explicit shouldPoll state + useEffect to bridge this gap.
 */

export function useRunJob(jobId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => runsApi.runJob(jobId),

    // Optimistically assume run is queued
    onMutate: async () => {
      // Cancel pending queries
      await queryClient.cancelQueries({ queryKey: ["job-stats", jobId] });

      // Get previous data for rollback
      const previous = queryClient.getQueryData(["job-stats", jobId]);

      // Optimistically update with queued state
      queryClient.setQueryData(["job-stats", jobId], (old) => ({
        ...old,
        data: {
          ...old?.data,
          activeRun: {
            runId: "optimistic",
            status: "queued",
            startedAt: new Date().toISOString(),
          },
        },
      }));

      return { previous };
    },

    onSuccess: () => {
      // Invalidate and refetch to get real run data from backend
      // This triggers polling in useJobStats
      queryClient.invalidateQueries({ queryKey: ["job-stats", jobId] });
      queryClient.invalidateQueries({ queryKey: ["job-history", jobId] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },

    onError: (error, _, context) => {
      // Rollback optimistic update on error
      if (context?.previous) {
        queryClient.setQueryData(["job-stats", jobId], context.previous);
      }
    },
  });
}
