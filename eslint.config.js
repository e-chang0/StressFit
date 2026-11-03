export default [
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**', '.npm-ci-cache/**'] },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { document: 'readonly', console: 'readonly', process: 'readonly', URL: 'readonly' },
    },
    rules: {
      'no-unused-vars': 'error',
      'no-undef': 'error',
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
];
