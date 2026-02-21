const crypto = require("crypto");

const ALGO = "aes-256-gcm";
const KEY_LEN = 32;
const IV_LEN = 16;
function getKey() {
  const secret =
    process.env.ENCRYPTION_KEY || "default-key-change-in-production-32bytes!!";
  return crypto.scryptSync(secret, "wp-analytics-salt", KEY_LEN);
}

function encrypt(text) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, enc]).toString("base64");
}

function decrypt(encrypted) {
  const key = getKey();
  const buf = Buffer.from(encrypted, "base64");
  const iv = buf.subarray(0, IV_LEN);
  const authTag = buf.subarray(IV_LEN, IV_LEN + 16);
  const data = buf.subarray(IV_LEN + 16);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(data) + decipher.final("utf8");
}

module.exports = { encrypt, decrypt };
