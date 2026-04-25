const sanitizeObject = (value) => {
  if (!value || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeObject);
  }

  const sanitized = {};
  Object.keys(value).forEach((key) => {
    // Block NoSQL operator injection and dotted path injection
    if (key.startsWith("$") || key.includes(".")) {
      return;
    }
    sanitized[key] = sanitizeObject(value[key]);
  });
  return sanitized;
};

const securitySanitizer = (req, res, next) => {
  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);
  next();
};

module.exports = securitySanitizer;
