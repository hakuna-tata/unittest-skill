const sinon = require('sinon');
const { globalApp } = require('./testDemo');
const { expect } = require('chai');

describe('spy_test',() => {
    afterEach(() => {
        sinon.restore();
    });

    it('spy report',() => {
        // 上报场景
        const spy = sinon.spy(globalApp, 'report');
        globalApp.report({
            larkNum: '123456',
            system: 'ios',
            // ...
        });
        expect(spy.callCount).to.equal(1);
    });
});
