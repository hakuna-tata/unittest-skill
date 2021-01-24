const sinon = require('sinon');

const clock = sinon.useFakeTimers();

setTimeout(() => {
    console.log('FAKE1 TIMEOUT');
}, 2000);

setTimeout(() => {
    console.log('FAKE2 TIMEOUT');
}, 1000);

clock.tick(3000);

console.log('sync');