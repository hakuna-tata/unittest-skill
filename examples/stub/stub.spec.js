const sinon = require('sinon');
const { globalApp } = require('./testDemo');
const { expect } = require('chai');

describe('stub_test',() => {
    afterEach(() => {
        sinon.restore();
    });

    it('callsFake',() => {
        const fake = sinon.fake.returns('fake');
        sinon.stub(globalApp.window.larkFun, 'invoke').callsFake((cb) => {
            return cb();
        });

        expect(globalApp.window.larkFun.invoke(fake)).to.equal('fake')
    });
});
