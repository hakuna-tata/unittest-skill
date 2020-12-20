# sandbox
当我们对某个模块进行单元测试的时候，希望整个模块的每个测试用例的测试环境是独立的，即每个测试用例相互之间、执行顺序等是不影响的。所以 sandbox 就起到了清理作用（其实借助的是
sandbox 暴露出的 restore 方法）。

## sandbox 环境的创建
> sinon 提供了三种方式创建一个沙箱环境
1. sinon
> 来看官网的一句话：Since sinon@5.0.0, the sinon object is a default sandbox. Unless you have a very advanced setup or need a special configuration, you probably want to only use that one.  
大概意思就是：从  sinon@5.0.0 后， sinon 对象就是一个默认的沙箱。如果你没有什么特别的定制化需要，直接用 sinon 就可以了。


2. const sandbox = sinon.createSandbox()

3. const sandbox = sinon.createSandbox(config)

## 总结