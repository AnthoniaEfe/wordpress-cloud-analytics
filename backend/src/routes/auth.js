const express = require("express");
const User = require("../models/User");
const { auth: authMiddleware, JWT_SECRET } = require("../middleware/auth");
const { verifyCaptcha } = require("../middleware/captcha");
const { authLimiter } = require("../middleware/rateLimit");
const jwt = require("jsonwebtoken");
const router = express.Router();

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.use(authLimiter);

router.post(
  "/register",
  verifyCaptcha,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const { email, password, name } = body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ error: "Email already registered" });
    const user = await User.create({ email, password, name: name || "" });
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });
    return res.status(201).json({
      user: { id: user._id, email: user.email, name: user.name },
      token,
    });
  })
);

router.post(
  "/login",
  verifyCaptcha,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const { email, password } = body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });
    return res.json({
      user: { id: user._id, email: user.email, name: user.name },
      token,
    });
  })
);

router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
