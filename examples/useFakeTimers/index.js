const sinon = require('sinon');
console.log(setTimeout);
console.log(setImmediate);
console.log(requestAnimationFrame);

const clock = sinon.useFakeTimers();

clock.tick(1000);

