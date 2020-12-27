const sinon = require('sinon');

// 法1
const testFun1 = (fn) => {
    fn();
};
const cb = sinon.spy();
testFun1(cb);
console.log(cb.called);

// 法2
const testFun2 = (a, b) => { return a + b; };
const spy = sinon.spy(testFun2);
spy(1, 2);
console.log(spy.returnValues[0])

// 法3
const testObj = {
    test: () => ({})
};
sinon.spy(testObj, 'test');
testObj.test();
console.log(testObj.test.called);