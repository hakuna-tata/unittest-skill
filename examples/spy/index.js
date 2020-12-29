const sinon = require('sinon');

// 法1
const cb = sinon.spy();
cb({
    name: 'fff',
    age: 24
});
console.log(cb.calledWith({ name: 'fff' }));

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