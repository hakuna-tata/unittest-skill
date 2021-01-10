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

上述介绍的是收集`timer`的场景。现在来介绍是如何让`delay time`提前的，进而就可以做到一些延迟的回调可以得到立即执行。定义还是在`@sinonjs/fake-timers`这个包中。
```js

// 返回 clock 中收集在 tickValue 范围内的 timer
function firstTimerInRange(clock, from, to) {
    var timers = clock.timers;
    var timer = null;
    var id, isInRange;

    for (id in timers) {
        if (timers.hasOwnProperty(id)) {
            isInRange = inRange(from, to, timers[id]);

            if (
                isInRange &&
                (!timer || compareTimers(timer, timers[id]) === 1)
            ) {
                timer = timers[id];
            }
        }
    }

    return timer;
}

function callTimer(clock, timer) {
    if (typeof timer.interval === "number") {
        clock.timers[timer.id].callAt += timer.interval;
    } else {
        delete clock.timers[timer.id];
    }

    if (typeof timer.func === "function") {
        // 执行回调
        timer.func.apply(null, timer.args);
    } else {
        eval(timer.func);
    }
}


function createClock(start, loopLimit) {
    // ...
    function doTick(tickValue, isAsync, resolve, reject) {
        var msFloat =
            typeof tickValue === "number"
                ? tickValue
                : parseTime(tickValue);
        var ms = Math.floor(msFloat);
        var remainder = nanoRemainder(msFloat);
        var nanosTotal = nanos + remainder;
        // delay time
        var tickTo = clock.now + ms;

        if (msFloat < 0) {
            throw new TypeError("Negative ticks are not supported");
        }

        // adjust for positive overflow
        if (nanosTotal >= 1e6) {
            tickTo += 1;
            nanosTotal -= 1e6;
        }

        nanos = nanosTotal;
        // now time
        var tickFrom = clock.now;
        var previous = clock.now;
        var timer,
            firstException,
            oldNow,
            nextPromiseTick,
            compensationCheck,
            postTimerCall;

        clock.duringTick = true;

        // ...

        function doTickInner() {
            // 过滤出来的 timer
            timer = firstTimerInRange(clock, tickFrom, tickTo);
            while (timer && tickFrom <= tickTo) {
                if (clock.timers[timer.id]) {
                    tickFrom = timer.callAt;
                    clock.now = timer.callAt;
                    oldNow = clock.now;
                    try {
                        runJobs(clock);
                        // 执行 clock 中收集 timer 的回调函数
                        callTimer(clock, timer);
                    } catch (e) {
                        firstException = firstException || e;
                    }

                    if (isAsync) {
                        originalSetTimeout(nextPromiseTick);
                        return;
                    }

                    compensationCheck();
                }

                postTimerCall();
            }

            oldNow = clock.now;
            runJobs(clock);
            if (oldNow !== clock.now) {
                tickFrom += clock.now - oldNow;
                tickTo += clock.now - oldNow;
            }
            clock.duringTick = false;

            timer = firstTimerInRange(clock, tickFrom, tickTo);
            if (timer) {
                try {
                    clock.tick(tickTo - clock.now); // do it all again - for the remainder of the requested range
                } catch (e) {
                    firstException = firstException || e;
                }
            } else {
                clock.now = tickTo;

                nanos = nanosTotal;
            }
            if (firstException) {
                throw firstException;
            }

            if (isAsync) {
                resolve(clock.now);
            } else {
                // 前进到 tickValue 的时间
                return clock.now;
            }
        }

        nextPromiseTick =
            isAsync &&
            function() {
                try {
                    compensationCheck();
                    postTimerCall();
                    doTickInner();
                } catch (e) {
                    reject(e);
                }
            };

        compensationCheck = function() {
            // compensate for any setSystemTime() call during timer callback
            if (oldNow !== clock.now) {
                tickFrom += clock.now - oldNow;
                tickTo += clock.now - oldNow;
                previous += clock.now - oldNow;
            }
        };

        postTimerCall = function() {
            timer = firstTimerInRange(clock, previous, tickTo);
            previous = tickFrom;
        };

        return doTickInner();
    }
    clock.tick = function tick(tickValue) {
        return doTick(tickValue, false);
    };
    // ...
}
```
至此，`setTimeout`模式下收集以及执行`fake timers`的流程就分析完了，其它模式下的`timer`读者可以自己尝试 debug 分析下。

## 实际场景demo

[useFakeTimers debug环境](https://github.com/hakuna-tata/unittest-skill/blob/master/examples/useFakeTimers/index.js)  
[useFakeTimers 实际使用场景](https://github.com/hakuna-tata/unittest-skill/tree/master/examples/useFakeTimers/useFakeTimers.spec.js)

## 总结
sandbox 的 `useFakeTimers API`主要依赖包`@sinonjs/fake-timers`，在实际测试场景中`useFakeTimers`可用于**需要调度语义但又不想真正等待时间的情况**。