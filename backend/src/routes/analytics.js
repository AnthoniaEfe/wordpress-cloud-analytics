const express = require("express");
const WordPressSite = require("../models/WordPressSite");
const AnalyticsSnapshot = require("../models/AnalyticsSnapshot");
const { auth } = require("../middleware/auth");
const wp = require("../services/wordpress");
const pagespeed = require("../services/pagespeed");
const router = express.Router();

const CACHE_MINS = 30;

router.use(auth);

async function getSite(userId, siteId) {
  const site = await WordPressSite.findOne({ _id: siteId, userId });
  if (!site) return null;
  return site;
}

router.get("/engagement/:siteId", async (req, res) => {
  try {
    const site = await getSite(req.user._id, req.params.siteId);
    if (!site) return res.status(404).json({ error: "Site not found" });

    const cached = await AnalyticsSnapshot.findOne({
      siteId: site._id,
      type: "engagement",
    }).sort({ fetchedAt: -1 });
    if (
      cached &&
      Date.now() - cached.fetchedAt.getTime() < CACHE_MINS * 60 * 1000
    ) {
      return res.json({
        data: cached.data,
        cached: true,
        fetchedAt: cached.fetchedAt,
      });
    }

    const data = await wp.fetchEngagement(
      site.siteUrl,
      site.credentialsEncrypted
    );
    await WordPressSite.updateOne(
      { _id: site._id },
      { lastSyncAt: new Date() }
    );
    await AnalyticsSnapshot.create({
      siteId: site._id,
      type: "engagement",
      data,
    });
    res.json({ data, cached: false, fetchedAt: new Date() });
  } catch (err) {
    res
      .status(500)
      .json({ error: err.message || "Failed to fetch engagement" });
  }
});

router.get("/performance/:siteId", async (req, res) => {
  try {
    const site = await getSite(req.user._id, req.params.siteId);
    if (!site) return res.status(404).json({ error: "Site not found" });

    const cached = await AnalyticsSnapshot.findOne({
      siteId: site._id,
      type: "performance",
    }).sort({ fetchedAt: -1 });
    if (
      cached &&
      Date.now() - cached.fetchedAt.getTime() < CACHE_MINS * 60 * 1000
    ) {
      return res.json({
        data: cached.data,
        cached: true,
        fetchedAt: cached.fetchedAt,
      });
    }

    const siteUrl = site.siteUrl.startsWith("http")
      ? site.siteUrl
      : `https://${site.siteUrl}`;
    const data = await pagespeed.fetchPerformance(
      siteUrl,
      process.env.PAGESPEED_API_KEY
    );
    await AnalyticsSnapshot.create({
      siteId: site._id,
      type: "performance",
      data,
    });
    res.json({ data, cached: false, fetchedAt: new Date() });
  } catch (err) {
    res
      .status(500)
      .json({ error: err.message || "Failed to fetch performance" });
  }
});

router.get("/seo/:siteId", async (req, res) => {
  try {
    const site = await getSite(req.user._id, req.params.siteId);
    if (!site) return res.status(404).json({ error: "Site not found" });

    const cached = await AnalyticsSnapshot.findOne({
      siteId: site._id,
      type: "seo",
    }).sort({ fetchedAt: -1 });
    if (
      cached &&
      Date.now() - cached.fetchedAt.getTime() < CACHE_MINS * 60 * 1000
    ) {
      return res.json({
        data: cached.data,
        cached: true,
        fetchedAt: cached.fetchedAt,
      });
    }

    const data = await wp.fetchSeoFromPosts(
      site.siteUrl,
      site.credentialsEncrypted
    );
    await AnalyticsSnapshot.create({ siteId: site._id, type: "seo", data });
    res.json({ data, cached: false, fetchedAt: new Date() });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch SEO data" });
  }
});

module.exports = router;
