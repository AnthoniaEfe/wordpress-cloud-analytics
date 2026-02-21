const mongoose = require("mongoose");

const analyticsSnapshotSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WordPressSite",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["engagement", "performance", "seo"],
    },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    fetchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

analyticsSnapshotSchema.index({ siteId: 1, type: 1, fetchedAt: -1 });

module.exports = mongoose.model("AnalyticsSnapshot", analyticsSnapshotSchema);
