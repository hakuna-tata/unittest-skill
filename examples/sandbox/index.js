
// 法1
const sinon = require('sinon');

// 法2
const sandbox1 = sinon.createSandbox();

// 法3
const sinonApi = {};
const sandbox2 = sinon.createSandbox({
    injectInto: sinonApi,
    properties: ["spy", "stub", "mock", "clock", "server", "requests"],
    useFakeTimers: true,
    useFakeServer: true
});