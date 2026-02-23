const HEADER = "x-anonymous-id";

function getOrCreateId(headerValue) {
  if (
    headerValue &&
    typeof headerValue === "string" &&
    headerValue.trim().length >= 8
  ) {
    return headerValue.trim();
  }
  return null;
}

function ownerId(req, res, next) {
  req.ownerId = getOrCreateId(req.headers[HEADER]);
  next();
}

function requireOwnerId(req, res, next) {
  if (!req.ownerId) {
    return res.status(400).json({
      error:
        "Missing X-Anonymous-Id header. Use a persistent anonymous id (e.g. UUID) to scope your sites.",
    });
  }
  next();
}

module.exports = { ownerId, requireOwnerId };
