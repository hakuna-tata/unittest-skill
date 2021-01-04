const sinon = require('sinon');
const { cutCount } = require('./testDemo');
const { expect } = require('chai');

describe('useFakeTimers_test',() => {
    let clock;
    beforeEach(() => {
        clock = sinon.useFakeTimers();
    })
    afterEach(() => {
        clock.restore();
    });

    it('by setTimeout',(done) => {
        let initNumber = 3;
        cutCount(initNumber);
        const testFn = function() {
            console.log(initNumber);
            done();
        };
        testFn();
    });
})

 