const sinon = require('sinon');

const stub1 = sinon.stub();
stub1.withArgs('test1').returns(true);

console.log(stub1());
console.log(stub1('test1'));

const obj = {
    sum: function(a, b) {
        return a + b;
    }
};
sinon.stub(obj, 'sum').withArgs(2, 2).callsFake(() => {
    return 0;
});

obj.sum.callThrough();

console.log(obj.sum(2, 2));
console.log(obj.sum(1, 1));
