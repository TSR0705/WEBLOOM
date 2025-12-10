import { useQuery } from "@tanstack/react-query";
import { jobsApi } from "../api/jobs";

export function useJobs() {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: jobsApi.getAll,
  });
}

export function useJob(jobId) {
  return useQuery({
    queryKey: ["job", jobId],
    queryFn: () => jobsApi.getById(jobId),
    enabled: !!jobId,
  });
}

export function useJobStats(jobId) {
  return useQuery({
    queryKey: ["job-stats", jobId],
    queryFn: () => jobsApi.getStats(jobId),
    enabled: !!jobId,
  });
}

export function useJobHistory(jobId) {
  return useQuery({
    queryKey: ["job-history", jobId],
    queryFn: () => jobsApi.getHistory(jobId),
    enabled: !!jobId,
  });
}

export function useJobVersion(jobId, version) {
  return useQuery({
    queryKey: ["job-version", jobId, version],
    queryFn: () => jobsApi.getVersion(jobId, version),
    enabled: !!jobId && !!version,
  });
}

export function useJobCompare(jobId, v1, v2) {
  return useQuery({
    queryKey: ["job-compare", jobId, v1, v2],
    queryFn: () => jobsApi.compare(jobId, v1, v2),
    enabled: !!jobId && !!v1 && !!v2,
  });
}
