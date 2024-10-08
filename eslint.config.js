const mmkal = require('eslint-plugin-mmkal')

module.exports = [
  ...mmkal.recommendedNextConfigs,
  {
    ignores: [
      'src/components/ui/*', // folder is generated by shadcn
      '**/licenses.ts',
    ],
  },
  {
    files: ['src/components/*'],
    rules: {
      '@typescript-eslint/no-shadow': 'off',
    },
  },
]
