const sinon = require('sinon');

const testFun = (fn) => {
    fn();
};
// 法1
const cb = sinon.spy();
testFun(cb);
console.log(cb.called);

// 法2
const testObj = {
    test: () => ({})
};
sinon.spy(testObj, 'test');
testObj.test();
console.log(testObj.test.called);