module.exports = {
    extends: ["@commitlint/config-conventional"],
    rules: {
      "type-enum": [
          2,
          "always",
          [
          'feat', // 新功能
          'fix', // bug
          'docs', // 文档
          'style', // 样式
          'refactor', // 重构
          'test', // 测试
          'chore', // 依赖库、工具等
          ]
      ],
      "subject-full-stop": [0, "never"],
      "subject-case": [0, "never"],
    }
}