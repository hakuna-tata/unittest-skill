const sinon = require('sinon');

const sandbox1 = sinon.createSandbox();
const fake = sandbox1.fake();
const spy = sandbox1.spy();
const stub = sandbox1.stub();
sandbox1.restore();



const sinonApi = {}；
const sandbox2 = sinon.createSandbox({
    injectInto: sinonApi,
    properties: ["spy", "stub", "mock", "clock", "server", "requests"],
    useFakeTimers: true,
    useFakeServer: true
});
console.log(sinonApi);
sandbox2.restore();
console.log(sinonApi);