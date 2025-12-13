const fs = require("fs");
const path = require("path");

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  DEBUG: "debug",
};

// Get current timestamp
const getTimestamp = () => {
  return new Date().toISOString();
};

// Write log to file
const writeLog = (level, message) => {
  const logEntry = `${getTimestamp()} [${level.toUpperCase()}] ${
    typeof message === "object" ? JSON.stringify(message) : message
  }\n`;
  const logFile = path.join(
    logsDir,
    `${new Date().toISOString().split("T")[0]}.log`
  );

  fs.appendFileSync(logFile, logEntry);
};

// Logger class
class Logger {
  error(message) {
    if (process.env.NODE_ENV !== "test") {
      console.error(
        `[ERROR] ${getTimestamp()} ${
          typeof message === "object" ? JSON.stringify(message) : message
        }`
      );
      writeLog(LOG_LEVELS.ERROR, message);
    }
  }

  warn(message) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        `[WARN] ${getTimestamp()} ${
          typeof message === "object" ? JSON.stringify(message) : message
        }`
      );
      writeLog(LOG_LEVELS.WARN, message);
    }
  }

  info(message) {
    if (process.env.NODE_ENV !== "test") {
      console.info(
        `[INFO] ${getTimestamp()} ${
          typeof message === "object" ? JSON.stringify(message) : message
        }`
      );
      writeLog(LOG_LEVELS.INFO, message);
    }
  }

  debug(message) {
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.NODE_ENV !== "test"
    ) {
      console.debug(
        `[DEBUG] ${getTimestamp()} ${
          typeof message === "object" ? JSON.stringify(message) : message
        }`
      );
      writeLog(LOG_LEVELS.DEBUG, message);
    }
  }
}

module.exports = new Logger();
