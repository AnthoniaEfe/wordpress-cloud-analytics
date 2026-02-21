const axios = require("axios");

const PAGESPEED_URL =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

async function fetchPerformance(siteUrl, apiKey) {
  const url = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;
  const params = { url, category: "performance" };
  if (apiKey) params.key = apiKey;

  try {
    const { data } = await axios.get(PAGESPEED_URL, { params, timeout: 20000 });
    const lighthouse = data?.lighthouseResult;
    const categories = lighthouse?.categories || {};
    const perf = categories.performance || {};
    const audits = lighthouse?.audits || {};
    const fcp = audits["first-contentful-paint"]?.numericValue;
    const lcp = audits["largest-contentful-paint"]?.numericValue;

    return {
      performanceScore: Math.round((perf.score || 0) * 100),
      loadTime: fcp != null ? Math.round(fcp / 1000) : null,
      lcp: lcp != null ? Math.round(lcp / 1000) : null,
      mobileScore: null,
      desktopScore: Math.round((perf.score || 0) * 100),
    };
  } catch (err) {
    return {
      performanceScore: null,
      loadTime: null,
      lcp: null,
      mobileScore: null,
      desktopScore: null,
      error: err.message || "PageSpeed request failed",
    };
  }
}

module.exports = { fetchPerformance };
