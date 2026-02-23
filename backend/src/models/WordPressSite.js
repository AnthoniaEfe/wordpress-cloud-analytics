const mongoose = require("mongoose");

const wordPressSiteSchema = new mongoose.Schema(
  {
    ownerId: { type: String, required: false, trim: true },
    name: { type: String, required: false, trim: true },
    siteUrl: { type: String, required: true, trim: true },
    credentialsEncrypted: { type: String, required: true },
    lastSyncAt: { type: Date, default: null },
  },
  { timestamps: true }
);

wordPressSiteSchema.index({ ownerId: 1 });

module.exports = mongoose.model("WordPressSite", wordPressSiteSchema);
