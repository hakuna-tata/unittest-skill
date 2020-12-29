# spy  
`spy`函数的作用主要是收集函数的调用信息。可以创建匿名函数、包装被测模块已经存在的函数。

## sandbox.spy(object, "property")

这节主要来介绍`sandbox.spy(object, "property")`这种创建方式，首先它的入口定义在`./sinon/sandbox.js`中：
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
入口主要是将调用 spy 方法的参数传入`sinonSpy`。

## createSpy

这里主要是对透传的`object[property]`这个函数传入`createSpy`做一层代理，它的定义在`./sinon/proxy.js`中：
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
## createProxy

接着就是来给源函数加一层代理（拦截）的具体操作，额外的操作主要是扩展这个代理函数的API，它的定义在`./sinon/proxy.js`中：
```js
function createProxy(func, originalFunc) {
    // object[property] 函数套一层代理
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

## wrapMethod

最终`createSpy(object[property])`返回了上面这个代理函数，接着就执行`wrapMethod`函数，最终返回的还是传入的`method(即proxy函数)`，它的定义在`./sinon/util/core/wrap-method.js`中：
```js
function mirrorProperties(target, source) {
    for (var prop in source) {
        if (!hasOwnProperty(target, prop)) {
            target[prop] = source[prop];
        }
    }
}

var hasES5Support = "keys" in Object;

module.exports = function wrapMethod(object, property, method) {
    // ...

    var error, wrappedMethod, i, wrappedMethodDesc;

    var owned = object.hasOwnProperty ? object.hasOwnProperty(property) : hasOwnProperty(object, property);

    if (hasES5Support) {
        // ...

        var types = Object.keys(methodDesc);
        for (i = 0; i < types.length; i++) {
            wrappedMethod = wrappedMethodDesc[types[i]];
            checkWrappedMethod(wrappedMethod);
        }

        mirrorProperties(methodDesc, wrappedMethodDesc);
        for (i = 0; i < types.length; i++) {
            mirrorProperties(methodDesc[types[i]], wrappedMethodDesc[types[i]]);
        }
        // 重新定义object[property]的描述符 **importtant**
        Object.defineProperty(object, property, methodDesc);


        if (typeof method === "function" && object[property] !== method) {
            delete object[property];
            simplePropertyAssignment();
        }
    } else {
        simplePropertyAssignment();
    }

    extend.nonEnum(method, {
        displayName: property,

        wrappedMethod: wrappedMethod,

        // Set up an Error object for a stack trace which can be used later to find what line of
        // code the original method was created on.
        stackTraceError: new Error("Stack Trace for original"),

        restore: function() {
            // For prototype properties try to reset by delete first.
            // If this fails (ex: localStorage on mobile safari) then force a reset
            // via direct assignment.
            if (!owned) {
                // In some cases `delete` may throw an error
                try {
                    delete object[property];
                } catch (e) {} // eslint-disable-line no-empty
                // For native code functions `delete` fails without throwing an error
                // on Chrome < 43, PhantomJS, etc.
            } else if (hasES5Support) {
                Object.defineProperty(object, property, wrappedMethodDesc);
            }

            if (hasES5Support) {
                var descriptor = getPropertyDescriptor(object, property);
                if (descriptor && descriptor.value === method) {
                    object[property] = wrappedMethod;
                }
            } else {
                // Use strict equality comparison to check failures then force a reset
                // via direct assignment.
                if (object[property] === method) {
                    object[property] = wrappedMethod;
                }
            }
        }
    });

    method.restore.sinon = true;

    if (!hasES5Support) {
        mirrorProperties(method, wrappedMethod);
    }

    return method;
};
```

## 实际场景demo

[spy debug环境](https://github.com/hakuna-tata/unittest-skill/blob/master/examples/spy/index.js)  
[spy 实际使用场景](https://github.com/hakuna-tata/unittest-skill/tree/master/examples/spy/spy.spec.js)

## 总结

使用`spy`函数验证源函数的调用信息是一个不错的选择。