const express = require("express");
const WordPressSite = require("../models/WordPressSite");
const { auth } = require("../middleware/auth");
const { encrypt } = require("../utils/encrypt");
const wp = require("../services/wordpress");
const router = express.Router();

router.use(auth);

router.get("/", async (req, res) => {
  try {
    const sites = await WordPressSite.find({ userId: req.user._id })
      .select("-credentialsEncrypted")
      .sort({ createdAt: -1 });
    res.json({ sites });
  } catch (err) {
    res.status(500).json({ error: "Failed to list sites" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, siteUrl, username, appPassword } = req.body;
    if (!name || !siteUrl || !username || !appPassword) {
      return res
        .status(400)
        .json({ error: "name, siteUrl, username, and appPassword required" });
    }
    const credentialsEncrypted = encrypt(`${username}:${appPassword}`);
    const valid = await wp.validateConnection(siteUrl, credentialsEncrypted);
    if (!valid) {
      return res
        .status(400)
        .json({
          error:
            "Could not connect to WordPress site. Check URL and Application Password.",
        });
    }
    const site = await WordPressSite.create({
      userId: req.user._id,
      name: name.trim(),
      siteUrl: siteUrl.replace(/\/$/, ""),
      credentialsEncrypted,
    });
    const out = site.toObject();
    delete out.credentialsEncrypted;
    res.status(201).json({ site: out });
  } catch (err) {
    res.status(500).json({ error: "Failed to add site" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const site = await WordPressSite.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).select("-credentialsEncrypted");
    if (!site) return res.status(404).json({ error: "Site not found" });
    res.json({ site });
  } catch (err) {
    res.status(500).json({ error: "Failed to get site" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const site = await WordPressSite.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!site) return res.status(404).json({ error: "Site not found" });
    res.json({ message: "Site removed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete site" });
  }
});

module.exports = router;
