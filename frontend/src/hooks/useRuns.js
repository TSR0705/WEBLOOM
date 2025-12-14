import { useMutation, useQueryClient } from "@tanstack/react-query";
import { runsApi } from "../api/runs";

export function useRunJob(jobId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => runsApi.runJob(jobId),

    onSuccess: () => {
      // force-refresh related data
      queryClient.invalidateQueries({ queryKey: ["job-history", jobId] });
      queryClient.invalidateQueries({ queryKey: ["job-stats", jobId] });
    },
  });
}
