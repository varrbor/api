const js = require('@eslint/js');
const prettierConfig = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  prettierConfig,
  {
    plugins: { prettier: prettierPlugin },
    languageOptions: {
      ecmaVersion: 2017,
      globals: {
        ...globals.es2015,
        ...globals.node,
        ...globals.jest
      }
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off',
      'prettier/prettier': 'error'
    }
  }
];
