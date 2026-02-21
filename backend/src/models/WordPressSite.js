const mongoose = require("mongoose");

const wordPressSiteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    siteUrl: { type: String, required: true, trim: true },
    credentialsEncrypted: { type: String, required: true },
    lastSyncAt: { type: Date, default: null },
  },
  { timestamps: true }
);

wordPressSiteSchema.index({ userId: 1 });

module.exports = mongoose.model("WordPressSite", wordPressSiteSchema);
