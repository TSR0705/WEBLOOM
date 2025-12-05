module.exports = function PageModel(data) {
  return {
    jobId: data.jobId,
    url: data.url,
    lastChangedAt: null,
    createdAt: new Date(),
  };
};
