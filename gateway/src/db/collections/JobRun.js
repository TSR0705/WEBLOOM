module.exports = function JobRunModel(data) {
  return {
    jobId: data.jobId,
    status: "pending",
    startedAt: new Date(),
    finishedAt: null,
    timeoutAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minute timeout
  };
};
