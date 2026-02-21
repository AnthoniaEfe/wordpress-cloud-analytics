const axios = require("axios");

const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

const verifyCaptcha = async (req, res, next) => {
  try {
    const token =
      (req.body && req.body.captchaToken) || req.headers["x-captcha-token"];
    const secret = process.env.RECAPTCHA_SECRET_KEY;

    if (!secret) {
      return res.status(503).json({ error: "Captcha not configured" });
    }
    if (!token) {
      return res.status(400).json({ error: "Captcha token required" });
    }

    const { data } = await axios.post(
      RECAPTCHA_VERIFY_URL,
      new URLSearchParams({ secret, response: token }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 5000,
      }
    );
    if (!data.success) {
      return res.status(400).json({ error: "Invalid captcha" });
    }
    return next();
  } catch (err) {
    if (!res.headersSent) {
      return res.status(502).json({ error: "Captcha verification failed" });
    }
  }
};

module.exports = { verifyCaptcha };
