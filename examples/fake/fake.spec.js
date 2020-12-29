const sinon = require('sinon');
const { openUrl } = require('./testDemo');
const { expect } = require('chai');

describe('fake_test',() => {
    afterEach(() => {
        sinon.restore();
    });

    it('fake callback',() => {
        const callback = sinon.fake.returns('wwww.baidu.com');
        const result = openUrl(callback);
        expect(result).to.equal('wwww.baidu.com');
    });

    it('fake callback',() => {
        
        
    });
})

 