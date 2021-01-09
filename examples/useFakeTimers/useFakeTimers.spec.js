const sinon = require('sinon');
const { intervalCutCount, setTimeoutCutCount } = require('./testDemo');
const { expect } = require('chai');

describe('useFakeTimers_test',() => {
    let clock, origConsoleLog;
    let logger = [];
    before(() => {
        origConsoleLog = console.log;
        console.log = function (val) {
            logger.push(val);
        };
    })
    beforeEach(() => {
        clock = sinon.useFakeTimers();
    });
    afterEach(() => {
        clock.restore();
        logger = [];
    });

    it('by setInterval', () => {
        const start = 1, end = 5;
        intervalCutCount(start, end);
        
        clock.tick(4000);
        expect(logger.length).to.equal(end - start);
    });

    it('by setTimeout', () => {
        const start = 1, end = 5;
        setTimeoutCutCount(start, end);

        clock.tick(4000);
        expect(logger.length).to.equal(end);
    });
})

 