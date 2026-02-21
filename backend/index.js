require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./src/config/db");
const { apiLimiter } = require("./src/middleware/rateLimit");
const authRoutes = require("./src/routes/auth");
const sitesRoutes = require("./src/routes/sites");
const analyticsRoutes = require("./src/routes/analytics");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/sites", sitesRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use((err, req, res, next) => {
  console.error("Request error:", err.message || err);
  if (res.headersSent) return next(err);
  const status = err.status || (err.name === "ValidationError" ? 400 : 500);
  const message = err.message || "Server error";
  res.status(status).json({ error: message });
});

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
