module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/**test**/**/*.test.ts"],
  reporters: ["default"],
  testTimeout: 20000,
};
