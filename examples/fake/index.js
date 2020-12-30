const sinon = require('sinon');

const fake = sinon.fake();
fake();
console.log(fake.callCount);

const fake1 = sinon.fake.returns('test');

console.log(fake1());

const fake2 = sinon.fake.throws(new Error('not apple pie'));

fake2();