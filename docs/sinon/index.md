# 认识 sinon

当我们写单元测试时一个最大的绊脚石就是面对的代码过于复杂，比如 Ajax 请求，文件、数据库读写操作，setTimeout/setInterval 等等。

`Sinon`的作用就是替换代码中这些复杂的部分来简化测试用例的编写，官网对`Sinon`的描述也是 JavaScript 独立的测试 spy、stub、mock，并且适用于任何单元测试框架。

接下来就通过对`Sinon`源码的分析，编写一些实际项目可以用到的单测技巧。
