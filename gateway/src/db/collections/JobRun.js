module.exports = function JobRunModel(data) {
  return {
    jobId: data.jobId,
    status: "pending",
    startedAt: new Date(),
    finishedAt: null,
  };
};
