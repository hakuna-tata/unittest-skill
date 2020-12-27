# spy  
`spy`的用法主要是收集函数的调用信息。例如验证函数是否被调用、传参列表、返回值等等。

## spy 函数的创建  
`spy`是`Sandbox`实例上的一个方法。这节主要来介绍一下`sinon.spy(object, "property")`这种创建方式，首先它的入口定义在`./sinon/sandbox.js`中：
```js
function Sandbox() {
    var sandbox = this;
    var collection = [];
    var promiseLib;

    // ...

    function commonPostInitSetup(args, spy) {
        var object = args[0];
        var property = args[1];

        var isSpyingOnEntireObject = typeof property === "undefined" && typeof object === "object";

        if (isSpyingOnEntireObject) {
            var ownMethods = collectOwnMethods(spy);

            forEach(ownMethods, function(method) {
                push(collection, method);
            });

            usePromiseLibrary(promiseLib, ownMethods);
        } else {
            push(collection, spy);
            usePromiseLibrary(promiseLib, spy);
        }

        return spy;
    }

    sandbox.spy = function spy() {
        // 透传参数
        var createdSpy = sinonSpy.apply(sinonSpy, arguments);
        return commonPostInitSetup(arguments, createdSpy);
    };

    // ...
}
```
入口主要是将调用 spy 方法的参数传入`sinonSpy`，它的定义在`./sinon/spy.js`中：
```js
function createSpy(func) {
    var name;
    var funk = func;

    if (typeof funk !== "function") {
        funk = function() {
            return;
        };
    } else {
        name = functionName(funk);
    }

    var proxy = createProxy(funk, funk);

    // Inherit spy API:
    extend.nonEnum(proxy, spyApi);
    extend.nonEnum(proxy, {
        displayName: name || "spy",
        fakes: [],
        instantiateFake: createSpy,
        id: "spy#" + uuid++
    });
    return proxy;
}
function spy(object, property, types) {
    var descriptor, methodDesc;
    if (isEsModule(object)) {
        throw new TypeError("ES Modules cannot be spied");
    }
    // sinon.spy(myFunc)
    if (!property && typeof object === "function") {
        return createSpy(object);
    }
    // sinon.spy(object)
    if (!property && typeof object === "object") {
        return walkObject(spy, object);
    }
    // sinon.spy()
    if (!object && !property) {
        return createSpy(function() {
            return;
        });
    }
    // sinon.spy(object, "property")
    if (!types) {
        return wrapMethod(object, property, createSpy(object[property]));
    }
    // sinon.spy(object, "property", ["get", "set"])
    descriptor = {};
    methodDesc = getPropertyDescriptor(object, property);

    forEach(types, function(type) {
        descriptor[type] = createSpy(methodDesc[type]);
    });

    return wrapMethod(object, property, descriptor);
}

```
这一步主要是对参数的差异化进行校验然后执行`createSpy`这个函数，然后调用`createProxy`这个函数，它的定义在`./sinon/proxy.js`中：
```js
function createProxy(func, originalFunc) {
    var proxy = wrapFunction(func, originalFunc);

    // Inherit function properties:
    extend(proxy, func);

    proxy.prototype = func.prototype;

    extend.nonEnum(proxy, proxyApi);

    return proxy;
}

function wrapFunction(func, originalFunc) {
    // originalFunc 参数的个数
    var arity = originalFunc.length;
    var p;
    // Do not change this to use an eval. Projects that depend on sinon block the use of eval.
    // ref: https://github.com/sinonjs/sinon/issues/710
    switch (arity) {
        case 0:
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
    // 把属性合并到 p 这个函数上
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
