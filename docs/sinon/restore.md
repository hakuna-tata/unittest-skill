# restore

`restore`是 Sandbox 实例上的一个方法，当它被调用时，会把收集的测试替代进行清理，保证沙箱环境的独立性。它的定义在`./sinon/sandbox.js`中：
```js
var filter = arrayProto.filter;
var forEach = arrayProto.forEach;
var push = arrayProto.push;
var reverse = arrayProto.reverse;

function applyOnEach(fakes, method) {
    var matchingFakes = filter(fakes, function(fake) {
        return typeof fake[method] === "function";
    });

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
        applyOnEach(collection, "restore");
        collection = [];

        forEach(fakeRestorers, function(restorer) {
            restorer();
        });
        fakeRestorers = [];

        sandbox.restoreContext();
    };

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