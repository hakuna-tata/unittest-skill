# restore

`restore`是 Sandbox 实例上的一个方法，当它被调用时，会把收集的测试替代进行清理，保证沙箱环境的独立性。它的定义在`./sinon/sandbox.js`中：
```js
var filter = arrayProto.filter;
var forEach = arrayProto.forEach;
var push = arrayProto.push;
var reverse = arrayProto.reverse;

function applyOnEach(fakes, method) {
    // 过滤出具有 fake.restore: Function 的数据
    var matchingFakes = filter(fakes, function(fake) {
        return typeof fake[method] === "function";
    });
    // 过滤出的数据执行 restore 方法
    forEach(matchingFakes, function(fake) {
        fake[method]();
    });
}

function Sandbox() {
    var sandbox = this;
    var collection = [];
    var fakeRestorers = [];
    var promiseLib;
    
    /**
     * 
    **/

    sandbox.restore = function restore() {
        if (arguments.length) {
            throw new Error("sandbox.restore() does not take any parameters. Perhaps you meant stub.restore()");
        }
        
        reverse(collection);
        // 遍历 collection 中收集的假创建
        applyOnEach(collection, "restore");
        collection = [];
        // 处理 replace 系列的假创建
        forEach(fakeRestorers, function(restorer) {
            restorer();
        });
        fakeRestorers = [];

        sandbox.restoreContext();
    };

    // 处理 sinon.createSandbox(config) 这种情况的沙箱环境上下文
    sandbox.restoreContext = function restoreContext() {
        var injectedKeys = sandbox.injectedKeys;
        var injectInto = sandbox.injectInto;

        if (!injectedKeys) {
            return;
        }

        forEach(injectedKeys, function(injectedKey) {
            delete injectInto[injectedKey];
        });

        injectedKeys = [];
    };

    /**
     * 
    **/ 
}
```
当执行`sinon.restore()`或者`sanbox.restore()`时候，就可以把当前用例上下文里收集到的假创建全部清理一遍，然后在下个测试用例的时候构造新的`fake`,`spy`,`stub`等等就可以做到用例之前互不影响了。

## 实际场景Demo

[restore debug环境](https://github.com/hakuna-tata/unittest-skill/blob/master/examples/restore/index.js)  
[restore 实际使用场景](https://github.com/hakuna-tata/unittest-skill/tree/master/examples/sandbox/sandbox.spec.js)

## 总结  
那么至此就把沙箱环境的创建和清理工作介绍完了。从下一节就开始介绍`sinon`那些非常核心的测试替代功能。