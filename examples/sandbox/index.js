
const sinon = require('sinon');

const sandbox1 = sinon.createSandbox();

const sinonApi = {};
const sandbox2 = sinon.createSandbox({
    injectInto: sinonApi,
    properties: ["spy", "stub", "mock", "clock", "server", "requests"],
    useFakeTimers: true,
    useFakeServer: true
});