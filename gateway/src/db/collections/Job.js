module.exports = function JobModel(data) {
  return {
    name: data.name,
    url: data.url,
    schedule: data.schedule || "manual",
    status: "active",
    createdAt: new Date(),
    nextRunAt: null,
  };
};
