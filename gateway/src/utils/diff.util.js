function normalizeText(value) {
  return (value || "").trim();
}

function tokenizeText(text = "") {
  return text.toLowerCase().split(/\W+/).filter(Boolean);
}

function jaccardSimilarity(aTokens, bTokens) {
  const aSet = new Set(aTokens);
  const bSet = new Set(bTokens);

  if (aSet.size === 0 && bSet.size === 0) return 1;

  const smaller = aSet.size <= bSet.size ? aSet : bSet;
  const larger = aSet.size <= bSet.size ? bSet : aSet;

  let intersection = 0;
  for (const token of smaller) {
    if (larger.has(token)) intersection += 1;
  }

  const unionSize = new Set([...aSet, ...bSet]).size || 1;
  return intersection / unionSize;
}

function diffLinks(fromLinks = [], toLinks = []) {
  const fromMap = new Map();
  const toMap = new Map();

  fromLinks.forEach((link) => {
    const href = link?.href || "";
    if (!href || fromMap.has(href)) return;
    fromMap.set(href, { href, text: link.text || "" });
  });

  toLinks.forEach((link) => {
    const href = link?.href || "";
    if (!href || toMap.has(href)) return;
    toMap.set(href, { href, text: link.text || "" });
  });

  const addedLinks = [];
  const removedLinks = [];
  const modifiedLinks = [];

  for (const [href, toLink] of toMap.entries()) {
    if (!fromMap.has(href)) {
      addedLinks.push(toLink);
      continue;
    }

    const prev = fromMap.get(href);
    if (normalizeText(prev.text) !== normalizeText(toLink.text)) {
      modifiedLinks.push({
        href,
        beforeText: prev.text || "",
        afterText: toLink.text || "",
      });
    }
  }

  for (const [href, fromLink] of fromMap.entries()) {
    if (!toMap.has(href)) removedLinks.push(fromLink);
  }

  return { addedLinks, removedLinks, modifiedLinks };
}

function computeSnapshotDiff(fromSnapshot, toSnapshot) {
  const fromParsed = fromSnapshot?.parsed || {};
  const toParsed = toSnapshot?.parsed || {};

  const titleChanged =
    normalizeText(fromParsed.title) !== normalizeText(toParsed.title);
  const descriptionChanged =
    normalizeText(fromParsed.description) !==
    normalizeText(toParsed.description);

  const fromTokens = tokenizeText(fromParsed.text || "");
  const toTokens = tokenizeText(toParsed.text || "");
  const similarity = jaccardSimilarity(fromTokens, toTokens);
  const changeScore = 1 - similarity;

  const { addedLinks, removedLinks, modifiedLinks } = diffLinks(
    fromParsed.links || [],
    toParsed.links || []
  );

  return {
    titleChanged,
    descriptionChanged,
    textSimilarity: Number(similarity.toFixed(4)),
    changeScore: Number(changeScore.toFixed(4)),
    addedLinks,
    removedLinks,
    modifiedLinks,
  };
}

module.exports = {
  computeSnapshotDiff,
  tokenizeText,
  jaccardSimilarity,
};
