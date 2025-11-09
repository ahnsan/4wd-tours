const { loadEnv } = require("@medusajs/utils");
loadEnv("test", process.cwd());

module.exports = {
  transform: {
    "^.+\\.[jt]s$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript", decorators: true },
        },
      },
    ],
  },
  testEnvironment: "node",
  moduleFileExtensions: ["js", "ts", "json"],
  modulePathIgnorePatterns: ["dist/", "<rootDir>/.medusa/"],
  setupFiles: ["./integration-tests/setup.js"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ["text", "lcov", "html"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/.medusa/**",
    "!src/modules/resource_booking/migrations/**",
  ],
};

if (process.env.TEST_TYPE === "integration:http") {
  module.exports.testMatch = ["**/integration-tests/http/*.spec.[jt]s"];
} else if (process.env.TEST_TYPE === "integration:modules") {
  module.exports.testMatch = ["**/src/modules/*/__tests__/**/*.[jt]s"];
} else if (process.env.TEST_TYPE === "unit") {
  module.exports.testMatch = ["**/tests/unit/**/*.spec.[jt]s"];
} else if (process.env.TEST_TYPE === "api") {
  module.exports.testMatch = ["**/tests/api/**/*.spec.[jt]s"];
} else if (process.env.TEST_TYPE === "concurrency") {
  module.exports.testMatch = ["**/tests/concurrency/**/*.spec.[jt]s"];
} else if (process.env.TEST_TYPE === "integration") {
  module.exports.testMatch = ["**/tests/integration/**/*.spec.[jt]s"];
} else if (process.env.TEST_TYPE === "resource-booking") {
  module.exports.testMatch = [
    "**/tests/unit/resource-booking/**/*.spec.[jt]s",
    "**/tests/api/resource-booking/**/*.spec.[jt]s",
  ];
} else if (process.env.TEST_TYPE === "resource-booking:all") {
  module.exports.testMatch = [
    "**/tests/unit/resource-booking/**/*.spec.[jt]s",
    "**/tests/api/resource-booking/**/*.spec.[jt]s",
    "**/tests/concurrency/resource-booking/**/*.spec.[jt]s",
    "**/tests/integration/resource-booking/**/*.spec.[jt]s",
  ];
}
