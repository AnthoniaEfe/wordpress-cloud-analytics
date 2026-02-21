const axios = require("axios");
const { decrypt } = require("../utils/encrypt");

function baseUrl(siteUrl) {
  const url = siteUrl.replace(/\/$/, "");
  return url.startsWith("http") ? url : `https://${url}`;
}

function authHeader(credentialsEncrypted) {
  const raw = decrypt(credentialsEncrypted);
  const auth = Buffer.from(raw, "utf8").toString("base64");
  return { Authorization: `Basic ${auth}` };
}

async function validateConnection(siteUrl, credentialsEncrypted) {
  const base = baseUrl(siteUrl);
  try {
    const { status } = await axios.get(`${base}/wp-json/wp/v2/users/me`, {
      headers: authHeader(credentialsEncrypted),
      timeout: 10000,
      validateStatus: () => true,
    });
    return status === 200;
  } catch (err) {
    return false;
  }
}

async function fetchEngagement(siteUrl, credentialsEncrypted) {
  const base = baseUrl(siteUrl);
  const headers = authHeader(credentialsEncrypted);

  const [postsRes, commentsRes] = await Promise.all([
    axios
      .get(
        `${base}/wp-json/wp/v2/posts?per_page=100&_fields=id,date,comment_status`,
        { headers, timeout: 15000 }
      )
      .catch(() => ({ data: [] })),
    axios
      .get(`${base}/wp-json/wp/v2/comments?per_page=100&_fields=id,post,date`, {
        headers,
        timeout: 15000,
      })
      .catch(() => ({ data: [] })),
  ]);

  const posts = Array.isArray(postsRes.data) ? postsRes.data : [];
  const comments = Array.isArray(commentsRes.data) ? commentsRes.data : [];
  const commentCountByPost = {};
  comments.forEach((c) => {
    const pid = c.post;
    commentCountByPost[pid] = (commentCountByPost[pid] || 0) + 1;
  });
  const sorted = posts
    .filter((p) => commentCountByPost[p.id])
    .map((p) => ({
      id: p.id,
      date: p.date,
      comment_count: commentCountByPost[p.id] || 0,
    }))
    .sort((a, b) => b.comment_count - a.comment_count)
    .slice(0, 10);

  const recentComments = comments
    .slice(0, 20)
    .map((c) => ({ id: c.id, post: c.post, date: c.date }));

  return {
    totalPosts: posts.length,
    totalComments: comments.length,
    mostCommentedPosts: sorted,
    recentActivity: recentComments,
    publishingFrequency: posts.length
      ? posts.length / Math.max(1, daysSince(posts[posts.length - 1].date))
      : 0,
  };
}

function daysSince(dateStr) {
  const d = new Date(dateStr);
  return (Date.now() - d.getTime()) / (24 * 60 * 60 * 1000);
}

async function fetchSeoFromPosts(siteUrl, credentialsEncrypted) {
  const base = baseUrl(siteUrl);
  const { data: posts } = await axios
    .get(
      `${base}/wp-json/wp/v2/posts?per_page=50&_fields=id,title,excerpt,content`,
      {
        headers: authHeader(credentialsEncrypted),
        timeout: 15000,
      }
    )
    .catch(() => ({ data: [] }));

  const items = Array.isArray(posts) ? posts : [];
  let missingMeta = 0;
  let longTitles = 0;
  let shortTitles = 0;
  let missingAlt = 0;
  const titleLen = 50;
  const titleMax = 60;

  items.forEach((p) => {
    if (
      !p.excerpt ||
      (typeof p.excerpt === "object" && p.excerpt.rendered === "")
    )
      missingMeta++;
    const title =
      typeof p.title === "object"
        ? p.title?.rendered || ""
        : String(p.title || "");
    if (title.length > titleMax) longTitles++;
    if (title.length > 0 && title.length < titleLen) shortTitles++;
    const content =
      typeof p.content === "object"
        ? p.content?.rendered || ""
        : String(p.content || "");
    if (/<img(?![^>]*\balt=)/i.test(content)) missingAlt++;
  });

  const total = items.length || 1;
  const score = Math.round(
    100 -
      (missingMeta / total) * 20 -
      (longTitles / total) * 10 -
      (shortTitles / total) * 5 -
      (missingAlt / total) * 15
  );

  return {
    missingMetaDescriptions: missingMeta,
    longTitles,
    shortTitles,
    imageAltIssues: missingAlt,
    postsChecked: total,
    seoScore: Math.max(0, Math.min(100, score)),
  };
}

module.exports = {
  validateConnection,
  fetchEngagement,
  fetchSeoFromPosts,
  baseUrl,
};
