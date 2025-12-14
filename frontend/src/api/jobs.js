import { axiosInstance } from './axios'

export const jobsApi = {
  /* -----------------------
     READ OPERATIONS
  ------------------------ */

  getAll: async () => {
    const { data } = await axiosInstance.get('/jobs')
    return data
  },

  getById: async (jobId) => {
    const { data } = await axiosInstance.get(`/jobs/${jobId}`)
    return data
  },

  getStats: async (jobId) => {
    const { data } = await axiosInstance.get(`/jobs/${jobId}/stats`)
    return data
  },

  getHistory: async (jobId) => {
    const { data } = await axiosInstance.get(`/jobs/${jobId}/history`)
    return data
  },

  getVersion: async (jobId, version) => {
    const { data } = await axiosInstance.get(
      `/jobs/${jobId}/version/${version}`
    )
    return data
  },

  compare: async (jobId, v1, v2) => {
    const { data } = await axiosInstance.get(
      `/jobs/${jobId}/compare-v2`,
      { params: { v1, v2 } }
    )
    return data
  },

  /* -----------------------
     WRITE OPERATIONS (Phase 9B)
  ------------------------ */

  /**
   * Create a new job
   * payload: { name, url, schedule? }
   */
  create: async (payload) => {
    const { data } = await axiosInstance.post('/jobs', payload)
    return data
  },

  /**
   * Manually trigger a job run
   */
  run: async (jobId) => {
    const { data } = await axiosInstance.post(`/jobs/${jobId}/run`)
    return data
  },
}
