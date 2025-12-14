import { axiosInstance } from "./axios";

export const runsApi = {
  runJob: async (jobId) => {
    const { data } = await axiosInstance.post(`/runs/${jobId}/run`);
    return data;
  },
};
