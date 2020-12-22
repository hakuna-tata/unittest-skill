# sandbox
当我们对某个模块进行单元测试的时候，希望整个模块的每个测试用例的测试环境是独立的，即每个测试用例相互之间、执行顺序等是不影响的。`sandbox`环境起到了这样的作用（借助 restore 方法的清理功能)。

## sandbox 环境的创建
> `sinon`提供了三种方式创建一个沙箱环境

**1. sinon**
> 来看官网的一句话：Since sinon@5.0.0, the sinon object is a default sandbox. Unless you have a very advanced setup or need a special configuration, you probably want to only use that one.  
大概意思就是：从  sinon@5.0.0 后， sinon 对象就是一个默认的沙箱。如果你没有什么特别的定制化需要，直接用 sinon 就可以了。  

来看 sinon 仓库的入口 `/lib/sinon.js`:
```js
"use strict";

var behavior = require("./sinon/behavior");
var createSandbox = require("./sinon/create-sandbox");
var extend = require("./sinon/util/core/extend");
var fakeTimers = require("./sinon/util/fake-timers");
var format = require("./sinon/util/core/format");
var nise = require("nise");
var Sandbox = require("./sinon/sandbox");
var stub = require("./sinon/stub");

var apiMethods = {
    createSandbox: createSandbox,
    assert: require("./sinon/assert"),
    match: require("@sinonjs/samsam").createMatcher,
    restoreObject: require("./sinon/restore-object"),

    expectation: require("./sinon/mock-expectation"),
    defaultConfig: require("./sinon/util/core/default-config"),

    setFormatter: format.setFormatter,

    // fake timers
    timers: fakeTimers.timers,

    // fake XHR
    xhr: nise.fakeXhr.xhr,
    FakeXMLHttpRequest: nise.fakeXhr.FakeXMLHttpRequest,

    // fake server
    fakeServer: nise.fakeServer,
    fakeServerWithClock: nise.fakeServerWithClock,
    createFakeServer: nise.fakeServer.create.bind(nise.fakeServer),
    createFakeServerWithClock: nise.fakeServerWithClock.create.bind(nise.fakeServerWithClock),

    addBehavior: function(name, fn) {
        behavior.addBehavior(stub, name, fn);
    }
};

var sandbox = new Sandbox();

var api = extend(sandbox, apiMethods);

module.exports = api;
```
那么，当执行 `const sinon = require('sinon')` 时候，`sinon`就是导出的这个`api`，很明显`api`就是`Sandbox`实例和`默认的apiMethods`合并的结果。 

再来看看`./sinon/util/core/extend`的暴露的`extend`方法：
```js
function extendCommon(target, sources, doCopy) {
    var source, i, prop;

    for (i = 0; i < sources.length; i++) {
        source = sources[i];

        for (prop in source) {
            if (hasOwnProperty(source, prop)) {
                // 把默认 apiMethods 往 sandbox 实例上合并
                doCopy(target, source, prop);
            }
        }

        if (hasDontEnumBug && hasOwnProperty(source, "toString") && source.toString !== target.toString) {
            target.toString = source.toString;
        }
    }

    return target;
}

module.exports = function extend(target /*, sources */) {
    var sources = slice(arguments, 1);

    return extendCommon(target, sources, function copyValue(dest, source, prop) {
        var destOwnPropertyDescriptor = Object.getOwnPropertyDescriptor(dest, prop);
        var sourceOwnPropertyDescriptor = Object.getOwnPropertyDescriptor(source, prop);

        if (prop === "name" && !destOwnPropertyDescriptor.writable) {
            return;
        }

        Object.defineProperty(dest, prop, {
            configurable: sourceOwnPropertyDescriptor.configurable,
            enumerable: sourceOwnPropertyDescriptor.enumerable,
            writable: sourceOwnPropertyDescriptor.writable,
            value: sourceOwnPropertyDescriptor.value
        });
    });
};
```
所以最后`var api = extend(sandbox, apiMethods)`的结果是“加强版”的 `sandbox` 实例，如果有相同属性则会被`apiMethods`中的重写。


**2. const sandbox = sinon.createSandbox()**

通过上面的分析可以看到`sinon`暴露了`createSandbox`这个API，在来看`./sinon/create-sandbox`的实现：
```js
"use strict";

var arrayProto = require("@sinonjs/commons").prototypes.array;
var Sandbox = require("./sandbox");

var forEach = arrayProto.forEach;
var push = arrayProto.push;

function prepareSandboxFromConfig(config) {
    var sandbox = new Sandbox();

    // 处理 config 的 useFakeServer 参数
    if (config.useFakeServer) {
        if (typeof config.useFakeServer === "object") {
            sandbox.serverPrototype = config.useFakeServer;
        }

        sandbox.useFakeServer();
    }

    // 处理 config 的 useFakeTimers 参数
    if (config.useFakeTimers) {
        if (typeof config.useFakeTimers === "object") {
            sandbox.useFakeTimers(config.useFakeTimers);
        } else {
            sandbox.useFakeTimers();
        }
    }

    return sandbox;
}

function exposeValue(sandbox, config, key, value) {
    if (!value) {
        return;
    }

    if (config.injectInto && !(key in config.injectInto)) {
        config.injectInto[key] = value;
        push(sandbox.injectedKeys, key);
    } else {
        push(sandbox.args, value);
    }
}

function createSandbox(config) {
    // config 为空直接返回 Sandbox 实例
    if (!config) {
        return new Sandbox();
    }
    // config 配置处理
    var configuredSandbox = prepareSandboxFromConfig(config);
    configuredSandbox.args = configuredSandbox.args || [];
    configuredSandbox.injectedKeys = [];
    // 处理 config 的 injectInto 参数
    configuredSandbox.injectInto = config.injectInto;
    var exposed = configuredSandbox.inject({});

    // 处理 config 的 properties 参数
    if (config.properties) {
        forEach(config.properties, function(prop) {
            // 判断 sandbox.inject 返回的 exposed 对象中有没有 properties 里定义的属性
            var value = exposed[prop] || (prop === "sandbox" && configuredSandbox);
            exposeValue(configuredSandbox, config, prop, value);
        });
    } else {
        exposeValue(configuredSandbox, config, "sandbox");
    }

    return configuredSandbox;
}

module.exports = createSandbox;

```
config 为空，直接返回了`Sandbox 实例`。所以相对与`sinon`来说，最终的 `sandbox` 自然就少了“加强版”部分默认的`apiMethods`。

**3. const sandbox = sinon.createSandbox(config)**  

只是多了一个`config`配置化参数，但是`sinon`只接受处理四个参数，分别是`injectInto`、`properties`、`useFakeTimers`、`useFakeServer`。这里的主要功能就是把`config.properties`里定义的属性，经过遍历注入`config.injectInto`或者`[]`。  

有 1 处关键的代码是`var exposed = configuredSandbox.inject({})`，再来看`./sinon/sandbox`中`inject方法`的实现：
```js
function Sandbox() {
    var sandbox = this;
    var collection = [];
    var fakeRestorers = [];
    var promiseLib;

    /**
     * 
    **/

    sandbox.inject = function inject(obj) {
        obj.spy = function() {
            return sandbox.spy.apply(null, arguments);
        };

        obj.stub = function() {
            return sandbox.stub.apply(null, arguments);
        };

        obj.mock = function() {
            return sandbox.mock.apply(null, arguments);
        };

        obj.createStubInstance = function() {
            return sandbox.createStubInstance.apply(sandbox, arguments);
        };

        obj.fake = function() {
            return sandbox.fake.apply(null, arguments);
        };

        obj.replace = function() {
            return sandbox.replace.apply(null, arguments);
        };

        obj.replaceSetter = function() {
            return sandbox.replaceSetter.apply(null, arguments);
        };

        obj.replaceGetter = function() {
            return sandbox.replaceGetter.apply(null, arguments);
        };

        if (sandbox.clock) {
            obj.clock = sandbox.clock;
        }

        if (sandbox.server) {
            obj.server = sandbox.server;
            obj.requests = sandbox.server.requests;
        }

        obj.match = match;

        return obj;
    };

    /**
     * 
    **/
}

module.exports = Sandbox;
```
所以`config.properties`里的属性能不能注入到`config.injectInto`或者`[]`是通过`sandbox.inject`返回的对象中的属性决定的。

## 实际场景 Demo

[sandbox debug环境](https://github.com/hakuna-tata/unittest-skill/blob/master/examples/sandbox/index.js)  
[sandbox 实际使用场景](https://github.com/hakuna-tata/unittest-skill/tree/master/examples/sandbox/sandbox.spec.js)

## 总结

这一节主要讲的是如何创建一个沙箱环境，作用是很大的简化了每个测试用例后的清理工作，下一节将来介绍`Sandbox 实例的 restore`方法是如何清理这些假创建。