/** @typedef {import('@web/test-runner').TestRunnerConfig} TestRunnerConfig */

export default /** @type TestRunnerConfig */ ({
  concurrency: 1,
  testFramework: {
    config: {
      timeout: 5000,
    },
  },
});
