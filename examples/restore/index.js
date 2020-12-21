const sinon = require('sinon');

const sandbox = sinon.createSandbox();

const fake = sandbox.fake();
const spy = sandbox.spy();
const stub = sandbox.stub();

sandbox.restore();