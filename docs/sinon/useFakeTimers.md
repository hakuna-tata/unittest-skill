# useFakeTimers
`useFakeTimers`函数主要是把`setTimeout`,`nextTick`,`Date`这一系列的全局函数进行了同步实现，其实就是将这些方法都重写了。

## sandbox.useFakeTimers()

这节主要根据`sandbox.useFakeTimers()`这个方法来介绍`fake timers`，它的入口定义在`./sinon/sandbox.js`中:
```js
var sinonClock = require("./util/fake-timers");

function Sandbox() {
    var sandbox = this;
    var collection = [];

    // ...

    sandbox.useFakeTimers = function useFakeTimers(args) {
         // 透传参数
        var clock = sinonClock.useFakeTimers.call(null, args);

        sandbox.clock = clock;
        push(collection, clock);

        return clock;
    };

    // ...
}
```

# createClock

调用`createClock`函数时 config 参数为 { now: 0 }, globalCtx 为 undefined，那最重要就是看`@sinonjs/fake-timers`对上下文做了什么处理了。
```js
var FakeTimers = require("@sinonjs/fake-timers");

function createClock(config, globalCtx) {
    var FakeTimersCtx = FakeTimers;
    if (globalCtx !== null && typeof globalCtx === "object") {
        FakeTimersCtx = FakeTimers.withGlobal(globalCtx);
    }
    // @sinonjs/fake-timers !!!important
    var clock = FakeTimersCtx.install(config);
    clock.restore = clock.uninstall;
    return clock;
}

exports.useFakeTimers = function(dateOrConfig) {
    var hasArguments = typeof dateOrConfig !== "undefined";
    var argumentIsDateLike =
        (typeof dateOrConfig === "number" || dateOrConfig instanceof Date) && arguments.length === 1;
    var argumentIsObject = dateOrConfig !== null && typeof dateOrConfig === "object" && arguments.length === 1;

    if (!hasArguments) {
        // sandbox.useFakeTimers()
        return createClock({
            now: 0
        });
    }

    if (argumentIsDateLike) {
        return createClock({
            now: dateOrConfig
        });
    }

    if (argumentIsObject) {
        var config = extend.nonEnum({}, dateOrConfig);
        var globalCtx = config.global;
        delete config.global;
        return createClock(config, globalCtx);
    }

    throw new TypeError("useFakeTimers expected epoch or config object. See https://github.com/sinonjs/sinon");
};
```

## FakeTimers

先对`@sinonjs/fake-timers`这个包进行总览，可以看到调用`install`方法时，运行的是`withGlobal`函数返回值中的`install`方法。

```js
function withGlobal(_global) {
    // .....
    return {
        timers: timers,
        createClock: createClock,
        // FakeTimersCtx.install(config)
        install: install,
        withGlobal: withGlobal
    };
}

var defaultImplementation = withGlobal(globalObject);

exports.timers = defaultImplementation.timers;
exports.createClock = defaultImplementation.createClock;
// FakeTimersCtx.install(config)
exports.install = defaultImplementation.install;
exports.withGlobal = withGlobal;
```

## install

这里重要的就是两步，一步是创建`clock API`，还有一步就是劫持`timers`中定义的这些方法通过`hijackMethod`进行包装。  
```js
function createClock(start, loopLimit) {
    // ...

    clock.setTimeout = function setTimeout(func, timeout) {
        // clock 中会创建一个 timers 对象用唯一 id 存储每个 timer
        return addTimer(clock, {
            func: func,
            args: Array.prototype.slice.call(arguments, 2),
            delay: timeout
        });
    };

    // ...

    clock.clearTimeout = function clearTimeout(timerId) {
            return clearTimer(clock, timerId, "Timeout");
        };

    clock.nextTick = function nextTick(func) {
        return enqueueJob(clock, {
            func: func,
            args: Array.prototype.slice.call(arguments, 1)
        });
    };

    // ....

    return clock;
}


function install(config) { // config = { now: 0 }
    if (
        arguments.length > 1 ||
        config instanceof Date ||
        Array.isArray(config) ||
        typeof config === "number"
    ) {
        throw new TypeError(
            "FakeTimers.install called with " +
                String(config) +
                " install requires an object parameter"
        );
    }

    config = typeof config !== "undefined" ? config : {};
    config.shouldAdvanceTime = config.shouldAdvanceTime || false;
    config.advanceTimeDelta = config.advanceTimeDelta || 20;

    var i, l;
    // 默认是 global 全局上下文
    var target = config.target || _global;
    // 创建 clock 
    var clock = createClock(config.now, config.loopLimit);

    clock.uninstall = function() {
        return uninstall(clock, target, config);
    };

    clock.methods = config.toFake || [];

    if (clock.methods.length === 0) {
        //  timers = ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 
        //    'setImmediate', 'clearImmediate', 'hrtime', 'nextTick', 'queueMicrotask']
        clock.methods = keys(timers).filter(function(key) {
            return key !== "nextTick" && key !== "queueMicrotask";
        });
    }

    for (i = 0, l = clock.methods.length; i < l; i++) {
        if (clock.methods[i] === "hrtime") {
            if (
                target.process &&
                typeof target.process.hrtime === "function"
            ) {
                hijackMethod(target.process, clock.methods[i], clock);
            }
        } else if (clock.methods[i] === "nextTick") {
            if (
                target.process &&
                typeof target.process.nextTick === "function"
            ) {
                hijackMethod(target.process, clock.methods[i], clock);
            }
        } else {
            if (
                clock.methods[i] === "setInterval" &&
                config.shouldAdvanceTime === true
            ) {
                var intervalTick = doIntervalTick.bind(
                    null,
                    clock,
                    config.advanceTimeDelta
                );
                var intervalId = target[clock.methods[i]](
                    intervalTick,
                    config.advanceTimeDelta
                );
                clock.attachedInterval = intervalId;
            }
            // setTimeout
            hijackMethod(target, clock.methods[i], clock);
        }
    }

    return clock;
}
```

## hijackMethod

所以在源代码中执行`setTimeout(fn, ms)`时，即执行的是`clock.setTimeout`。然后就回到了上面`install`里介绍的`addTimer`方法.
```js
function hijackMethod(target, method, clock) {
    var prop;
    clock[method].hadOwnProperty = Object.prototype.hasOwnProperty.call(
        target,
        method
    );
    clock["_" + method] = target[method];

    if (method === "Date") {
        var date = mirrorDateProperties(clock[method], target[method]);
        target[method] = date;
    } else if (method === "performance") {
        var originalPerfDescriptor = Object.getOwnPropertyDescriptor(
            target,
            method
        );
        // JSDOM has a read only performance field so we have to save/copy it differently
        if (
            originalPerfDescriptor &&
            originalPerfDescriptor.get &&
            !originalPerfDescriptor.set
        ) {
            Object.defineProperty(
                clock,
                "_" + method,
                originalPerfDescriptor
            );

            var perfDescriptor = Object.getOwnPropertyDescriptor(
                clock,
                method
            );
            Object.defineProperty(target, method, perfDescriptor);
        } else {
            target[method] = clock[method];
        }
    } else {
        // setTimeout （target 默认就是 global）
        target[method] = function() {
            return clock[method].apply(clock, arguments);
        };

        for (prop in clock[method]) {
            if (clock[method].hasOwnProperty(prop)) {
                target[method][prop] = clock[method][prop];
            }
        }
    }

    target[method].clock = clock;
}
```

## ---------------

## clock.tick(ms)

上述介绍的是收集`timer`的场景。现在来介绍是如何让`delay time`提前的，进而就可以做到一些延迟的回调可以得到立即执行。
```js
```

## 实际场景demo

[useFakeTimers debug环境](https://github.com/hakuna-tata/unittest-skill/blob/master/examples/useFakeTimers/index.js)  
[useFakeTimers 实际使用场景](https://github.com/hakuna-tata/unittest-skill/tree/master/examples/useFakeTimers/useFakeTimers.spec.js)