// Contents: ESLint configuration for the frontend project 
// ESLint is a tool that helps you write better code by analyzing your code and pointing out errors or bad practices.
// This configuration file extends the recommended ESLint configuration for React projects and adds a few custom rules.
// It also specifies the React version to use for linting.
// The rules in this configuration file are:
// - react/jsx-no-target-blank: Allows the use of target="_blank" in JSX elements.
// - react-refresh/only-export-components: Warns if a file that uses React Refresh contains anything other than React components.


module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react/jsx-no-target-blank': 'off',
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}