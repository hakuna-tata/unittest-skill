# stub
`stub`函数可以控制创建方法的行为（例如返回值、抛异常等等），还可以调用某个方法时候进行函数的替换。

## sandbox.stub.callsFake(fakeFunction)
`sandbox.stub.callsFake(fakeFunction)`在实际场景中使用比较多。至于具体的实现就不多做解析了，`stub`总体的实现和`fake`、`spy`几乎一样，实现细节可以从下面 debug 环境进入调试。

## 实际场景demo

[stub debug环境](https://github.com/hakuna-tata/unittest-skill/blob/master/examples/stub/index.js)  
[stub 实际使用场景](https://github.com/hakuna-tata/unittest-skill/tree/master/examples/stub/stub.spec.js)

## 总结

`stub`最大作用就是用于替换真正源函数实现。目的是用一个简单一点的行为替换一个复杂的行为，从而独立地测试代码的某一部分。
