module.exports = {
    base: '/unittest-skill/',
    dest: './dist',
    title: '单元测试技巧',
    themeConfig: {
        repo: 'hakuna-tata/unittest-skill/',
        editLinks: true,
        docsDir: 'docs',
        editLinkText: '在 Github 上编辑此页',
        lastUpdated: '上次更新',
        nav: [
            { text: 'Sinon', link: '/sinon/' },
        ],
        sidebar: {
            '/sinon/': [
                {
                    title: 'Sinon',
                    collapsable: false,
                    children: [
                        ['', 'Introduction'],
                        'sandbox',
                        'restore',
                        'fake',
                        'spy',
                        'stub',
                        'useFakeTimers'
                    ]
                }
            ],
        }
    },
}