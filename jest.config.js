/** Jest configuration for Community Health Centre API */
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: [
    "**/src/tests/**/*.test.js",
    "**/?(*.)+(spec|test).js"
  ],
  transform: {
    "^.+\\.js$": "babel-jest"
  },
  moduleFileExtensions: ["js", "json"],
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
};
