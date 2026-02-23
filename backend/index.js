require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./src/config/db");
const { apiLimiter } = require("./src/middleware/rateLimit");
const sitesRoutes = require("./src/routes/sites");
const analyticsRoutes = require("./src/routes/analytics");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed =
        !origin ||
        /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
        (process.env.FRONTEND_ORIGIN && origin === process.env.FRONTEND_ORIGIN);
      callback(null, allowed ? origin || true : false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }
  next(err);
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// if (process.env.NODE_ENV === "production") {
//   app.use(apiLimiter);
// }

app.use("/api/sites", sitesRoutes);
app.use("/api/analytics", analyticsRoutes);



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
