module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/index.js",
    "!src/config/**",
    "!src/middleware/**",
  ],
  coverageDirectory: "coverage",
  verbose: true,
  setupFilesAfterEnv: [],
};
