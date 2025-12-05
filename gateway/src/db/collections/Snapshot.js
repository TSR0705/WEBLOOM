module.exports = function SnapshotModel(data) {
  return {
    jobId: data.jobId,
    url: data.url,
    html: data.html,
    version: data.version || 1,
    createdAt: new Date(),
  };
};
