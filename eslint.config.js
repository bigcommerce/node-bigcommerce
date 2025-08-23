export default [
  {
    ignores: ['node_modules/**'],
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    rules: {
      // Add custom rules here if needed
    },
    extends: ['eslint:recommended'],
  },
];