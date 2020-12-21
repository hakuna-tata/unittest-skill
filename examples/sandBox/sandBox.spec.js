const sinon = require('sinon');
const testDemo = require('./testDemo');
const { expect } = require('chai');

// 方法1
describe('sinon_test',() => {
    let spyFun;

    beforeEach(() => {
        spyFun = sinon.spy(testDemo, 'add');
    });

    afterEach(() => {
        sinon.restore();
    });

    it('1+1=2',() => {
        testDemo.add(1, 1);
        expect(spyFun.callCount).to.equal(1)
    });

    it('4+5!=10',function(){
        testDemo.add(4, 5);
        expect(spyFun.callCount).to.equal(1);
    })
})

// 方法2
describe('sandbox_test',() => {
    let sandbox, spyFun;

    before(() => {
        sandbox = sinon.createSandbox();
    });
    
    beforeEach(() => {
        spyFun = sandbox.spy(testDemo, 'add');
    })

    afterEach(() => {
        sandbox.restore();
    });

    it('1+1=2',() => {
        testDemo.add(1, 1);
        expect(spyFun.callCount).to.equal(1)
    });

    it('4+5!=10',function(){
        testDemo.add(4, 5);
        expect(spyFun.callCount).to.equal(1);
    })
})
 