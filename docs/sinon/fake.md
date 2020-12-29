# fake
`fake`函数区别于`spy`和`stub`的最主要点是可以创建具体行为的函数。

## sandbox.fake.returns(value)

这节主要来介绍`sandbox.fake.returns(value)`创建具体行为的使用方式，它的定义在`./sinon/sandbox.js`中：
```js
var sinonFake = require("./fake");

function Sandbox() {
    var sandbox = this;
    var collection = [];
    var promiseLib;

    // ...

    // sandbox.fake()
    sandbox.fake = function fake(f) {
        var s = sinonFake.apply(sinonFake, arguments);

        push(collection, s);

        return s;
    };

    forEach(Object.keys(sinonFake), function(key) {
        var fakeBehavior = sinonFake[key];
        if (typeof fakeBehavior === "function") {
            // sandbox.fake.returns、sandbox.fake.throw 
            sandbox.fake[key] = function() {
                var s = fakeBehavior.apply(fakeBehavior, arguments);

                push(collection, s);

                return s;
            };
        }
    });

    // ...
}
```
## wrapFunc

执行`sandbox.fake.returns(value)`时返回的就是`wrapFunc(f)`,`f`函数传入`createProxy`做了一层代理并返回这个代理函数。它的定义在`./sinon/fake.js`中：
```js
function wrapFunc(f) {
    var proxy;
    var fakeInstance = function() {
        var firstArg, lastArg;

        if (arguments.length > 0) {
            firstArg = arguments[0];
            lastArg = arguments[arguments.length - 1];
        }

        var callback = lastArg && typeof lastArg === "function" ? lastArg : undefined;

        proxy.firstArg = firstArg;
        proxy.lastArg = lastArg;
        proxy.callback = callback;

        return f && f.apply(this, arguments);
    };
    proxy = createProxy(fakeInstance, f || fakeInstance);

    proxy.displayName = "fake";
    proxy.id = "fake#" + uuid++;

    return proxy;
}

function fakeClass() {
    // ...
    function fake(f) {
        if (arguments.length > 0 && typeof f !== "function") {
            throw new TypeError("Expected f argument to be a Function");
        }

        return wrapFunc(f);
    }
    // sandbox.fake.returns(value)
    fake.returns = function returns(value) {
        function f() {
            return value;
        }

        return wrapFunc(f);
    };

    fake.throws = function throws(value) {
        function f() {
            throw getError(value);
        }

        return wrapFunc(f);
    };

    fake.resolves = function resolves(value) {
        function f() {
            return promiseLib.resolve(value);
        }

        return wrapFunc(f);
    };

    fake.rejects = function rejects(value) {
        function f() {
            return promiseLib.reject(getError(value));
        }

        return wrapFunc(f);
    };

    // ...

    return fake;
}

module.exports = fakeClass();
```

## createProxy

接着就是来给源函数`f`加一层代理具体操作，额外的操作主要是扩展这个代理函数的API，它的定义在`./sinon/proxy.js`中：
```js
function createProxy(func, originalFunc) {
    var proxy = wrapFunction(func, originalFunc);

    extend(proxy, func);

    proxy.prototype = func.prototype;

    extend.nonEnum(proxy, proxyApi);

    return proxy;
}

function wrapFunction(func, originalFunc) {
    // originalFunc 参数的个数
    var arity = originalFunc.length;
    var p;
    switch (arity) {
        case 0:
            // 最终调用的函数
            p = function proxy() {
                return p.invoke(func, this, slice(arguments));
            };
            break;
        
        /**
         * 
        **/

        default:
            p = function proxy() {
                return p.invoke(func, this, slice(arguments));
            };
            break;
    }
    var nameDescriptor = Object.getOwnPropertyDescriptor(originalFunc, "name");
    if (nameDescriptor && nameDescriptor.configurable) {
        // IE 11 functions don't have a name.
        // Safari 9 has names that are not configurable.
        Object.defineProperty(p, "name", nameDescriptor);
    }
    // 加强 proxy 函数
    extend.nonEnum(p, {
        isSinonProxy: true,

        called: false,
        notCalled: true,
        calledOnce: false,
        calledTwice: false,
        calledThrice: false,
        callCount: 0,
        firstCall: null,
        firstArg: null,
        secondCall: null,
        thirdCall: null,
        lastCall: null,
        lastArg: null,
        args: [],
        returnValues: [],
        thisValues: [],
        exceptions: [],
        callIds: [],
        errorsWithCallStack: []
    });
    return p;
}
```

## 实际场景demo

[fake debug环境](https://github.com/hakuna-tata/unittest-skill/blob/master/examples/fake/index.js)  
[fake 实际使用场景](https://github.com/hakuna-tata/unittest-skill/tree/master/examples/fake/fake.spec.js)