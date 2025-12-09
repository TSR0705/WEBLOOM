const {
    getSnapshotsForJob,
    getRunsForJob,
    getChangeHistory,
    getSnapshotByVersion,
    getSnapshotWithHtml,
    getJobStats,
    getHistoryCollections,
  } = require("../services/history.service");
  const { computeSnapshotDiff } = require("../utils/diff.util");
  const { getJobById } = require("../services/job.service");
  
  function sendSuccess(res, { message, data, count, status = 200 }) {
    const payload = { success: true, message, data };
    if (typeof count === "number") payload.count = count;
    return res.status(status).json(payload);
  }
  
  function sendError(res, status, message) {
    return res.status(status).json({ success: false, message });
  }
  
  async function snapshots(req, res) {
    const { jobId } = req.params;
    try {
      const items = await getSnapshotsForJob(jobId);
      return sendSuccess(res, {
        message: "Snapshots fetched",
        data: { items },
        count: items.length,
      });
    } catch (err) {
      console.error("Failed to fetch snapshots", { jobId, err });
      return sendError(res, 500, "Failed to fetch snapshots");
    }
  }
  
  async function runs(req, res) {
    const { jobId } = req.params;
    try {
      const runs = await getRunsForJob(jobId);
      const items = runs.map((run) => {
        const runId =
          run?._id && typeof run._id.toString === "function"
            ? run._id.toString()
            : run._id;
  
        return {
          runId,
          status: run.status,
          finishedAt: run.finishedAt || null,
          startedAt: run.startedAt || null,
          analysisStatus: run.analysisStatus || null,
          analysisScore: run.analysisScore ?? null,
          analysisLabel: run.analysisLabel || null,
          analysisFinishedAt: run.analysisFinishedAt || null,
          statusProgression: [
            {
              stage: "crawl",
              status: run.status,
              at: run.finishedAt || run.startedAt || null,
            },
            {
              stage: "analysis",
              status: run.analysisStatus || "pending",
              at: run.analysisFinishedAt || null,
            },
          ],
        };
      });
      return sendSuccess(res, {
        message: "Runs fetched",
        data: { items },
        count: items.length,
      });
    } catch (err) {
      console.error("Failed to fetch runs", { jobId, err });
      return sendError(res, 500, "Failed to fetch runs");
    }
  }
  
  async function changeHistory(req, res) {
    const { jobId } = req.params;
    try {
      const records = await getChangeHistory(jobId);
      const items = records.map((item) => ({
        version: item.runVersion,
        previousVersion: item.previousVersion,
        score: item.changeScore,
        label: item.changeLabel,
        createdAt: item.createdAt,
      }));
  
      return sendSuccess(res, {
        message: "Change history fetched",
        data: { items },
        count: items.length,
      });
    } catch (err) {
      console.error("Failed to fetch change history", { jobId, err });
      return sendError(res, 500, "Failed to fetch change history");
    }
  }
  
  async function compare(req, res) {
    const { jobId } = req.params;
    const fromVersion = Number.parseInt(req.query.from, 10);
    const toVersion = Number.parseInt(req.query.to, 10);
  
    if (!Number.isInteger(fromVersion) || !Number.isInteger(toVersion)) {
      return sendError(res, 400, "from and to query params must be integers");
    }
  
    if (fromVersion <= 0 || toVersion <= 0) {
      return sendError(res, 400, "from and to must be positive integers");
    }
  
    try {
      const [fromSnapshot, toSnapshot] = await Promise.all([
        getSnapshotByVersion(jobId, fromVersion),
        getSnapshotByVersion(jobId, toVersion),
      ]);
  
      if (!fromSnapshot) {
        return sendError(res, 404, `Snapshot version ${fromVersion} not found`);
      }
  
      if (!toSnapshot) {
        return sendError(res, 404, `Snapshot version ${toVersion} not found`);
      }
  
      const changes = computeSnapshotDiff(fromSnapshot, toSnapshot);
  
      return sendSuccess(res, {
        message: "Comparison complete",
        data: {
          jobId,
          fromVersion,
          toVersion,
          changes,
        },
      });
    } catch (err) {
      console.error("Failed to compare snapshots", { jobId, err });
      return sendError(res, 500, "Failed to compare snapshots");
    }
  }
  
  async function history(req, res) {
    const { jobId } = req.params;
    try {
      const job = await getJobById(jobId);
      if (!job) return sendError(res, 404, "Job not found");
  
      const { runs, snapshots, changes } = await getHistoryCollections(jobId);
  
      const snapshotByVersion = new Map(snapshots.map((s) => [s.version, s]));
      const changeByVersion = new Map(changes.map((c) => [c.runVersion, c]));
  
      const timeline = runs.map((run) => {
        const runVersion = run.runVersion ?? run.version ?? null;
        const snap = runVersion ? snapshotByVersion.get(runVersion) : null;
        const change = runVersion ? changeByVersion.get(runVersion) : null;
  
        const createdAt =
          run.createdAt || run.startedAt || snap?.createdAt || null;
  
        return {
          version: runVersion || snap?.version || change?.runVersion || null,
          createdAt,
          status: run.status || "pending",
          analysisStatus: change?.changeLabel
            ? "done"
            : run.analysisStatus || null,
          analysisScore: change?.changeScore ?? run.analysisScore ?? null,
          analysisLabel: change?.changeLabel ?? run.analysisLabel ?? null,
        };
      });
  
      // include snapshots without runs
      snapshots.forEach((snap) => {
        const exists = timeline.find((t) => t.version === snap.version);
        if (exists) return;
        const change = changeByVersion.get(snap.version);
        timeline.push({
          version: snap.version,
          createdAt: snap.createdAt,
          status: "completed",
          analysisStatus: change?.changeLabel ? "done" : null,
          analysisScore: change?.changeScore ?? null,
          analysisLabel: change?.changeLabel ?? null,
        });
      });
  
      // include changes without runs/snapshots
      changes.forEach((change) => {
        const exists = timeline.find((t) => t.version === change.runVersion);
        if (exists) return;
        timeline.push({
          version: change.runVersion,
          createdAt: change.createdAt || null,
          status: "completed",
          analysisStatus: "done",
          analysisScore: change.changeScore,
          analysisLabel: change.changeLabel,
        });
      });
  
      timeline.sort((a, b) => {
        if (a.version == null) return 1;
        if (b.version == null) return -1;
        return a.version - b.version;
      });
  
      return res.json({
        jobId,
        url: job.url,
        timeline,
      });
    } catch (err) {
      console.error("Failed to build history", { jobId, err });
      return sendError(res, 500, "Failed to build history");
    }
  }
  
  async function versionDetail(req, res) {
    const { jobId, v } = req.params;
    const version = Number.parseInt(v, 10);
    if (!Number.isInteger(version) || version <= 0) {
      return sendError(res, 400, "Version must be a positive integer");
    }
  
    try {
      const snapshot = await getSnapshotWithHtml(jobId, version);
      if (!snapshot) {
        return sendError(res, 404, "Snapshot not found");
      }
  
      return res.json({
        version: snapshot.version,
        createdAt: snapshot.createdAt,
        parsed: snapshot.parsed || null,
        html: snapshot.html,
      });
    } catch (err) {
      console.error("Failed to fetch version detail", { jobId, version, err });
      return sendError(res, 500, "Failed to fetch version detail");
    }
  }
  
  function tokenizeWords(text = "") {
    return text
      .toLowerCase()
      .split(/[\s\W]+/)
      .filter(Boolean);
  }
  
  function linkHrefSet(links = []) {
    const set = new Set();
    links.forEach((l) => {
      if (l && l.href) set.add(l.href);
    });
    return set;
  }
  
  async function compareV2(req, res) {
    const { jobId } = req.params;
    const v1 = Number.parseInt(req.query.v1, 10);
    const v2 = Number.parseInt(req.query.v2, 10);
  
    if (!Number.isInteger(v1) || !Number.isInteger(v2) || v1 <= 0 || v2 <= 0) {
      return sendError(res, 400, "v1 and v2 must be positive integers");
    }
  
    try {
      const [snapA, snapB] = await Promise.all([
        getSnapshotWithHtml(jobId, v1),
        getSnapshotWithHtml(jobId, v2),
      ]);
  
      if (!snapA) return sendError(res, 404, `Snapshot v${v1} not found`);
      if (!snapB) return sendError(res, 404, `Snapshot v${v2} not found`);
  
      const prevWords = new Set(tokenizeWords(snapA.parsed?.text || ""));
      const currWords = new Set(tokenizeWords(snapB.parsed?.text || ""));
  
      const addedWords = [];
      const removedWords = [];
  
      currWords.forEach((w) => {
        if (!prevWords.has(w)) addedWords.push(w);
      });
      prevWords.forEach((w) => {
        if (!currWords.has(w)) removedWords.push(w);
      });
  
      const prevHrefSet = linkHrefSet(snapA.parsed?.links || []);
      const currHrefSet = linkHrefSet(snapB.parsed?.links || []);
  
      const addedLinks = [];
      const removedLinks = [];
  
      currHrefSet.forEach((href) => {
        if (!prevHrefSet.has(href)) addedLinks.push(href);
      });
      prevHrefSet.forEach((href) => {
        if (!currHrefSet.has(href)) removedLinks.push(href);
      });
  
      const denom = prevWords.size + currWords.size || 1;
      const changeScore =
        (addedWords.length +
          removedWords.length +
          addedLinks.length +
          removedLinks.length) /
        denom;
  
      let changeLabel = "low";
      if (changeScore > 0.6) changeLabel = "high";
      else if (changeScore > 0.25) changeLabel = "medium";
  
      return res.json({
        jobId,
        baseVersion: v1,
        targetVersion: v2,
        diffs: {
          text: {
            added: addedWords,
            removed: removedWords,
          },
          links: {
            added: addedLinks,
            removed: removedLinks,
          },
        },
        changeScore: Number(changeScore.toFixed(4)),
        changeLabel,
      });
    } catch (err) {
      console.error("Failed to compare versions", { jobId, v1, v2, err });
      return sendError(res, 500, "Failed to compare versions");
    }
  }
  async function stats(req, res) {
    const { jobId } = req.params;
    try {
      const data = await getJobStats(jobId);
      return sendSuccess(res, {
        message: "Job stats fetched",
        data,
      });
    } catch (err) {
      console.error("Failed to fetch job stats", { jobId, err });
      return sendError(res, 500, "Failed to fetch job stats");
    }
  }
  
  module.exports = {
    snapshots,
    runs,
    changeHistory,
    compare,
    stats,
    history,
    versionDetail,
    compareV2,
  };
 