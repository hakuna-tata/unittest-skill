const sinon = require('sinon');

const clock = sinon.useFakeTimers();

setTimeout(() => {
    console.log('FAKE TIMEOUT');
}, 3000);

clock.tick(3000);