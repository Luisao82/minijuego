import js from '@eslint/js'
import globals from 'globals'
import prettierConfig from 'eslint-config-prettier'

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        Phaser: 'readonly',
      },
    },
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: 'error',
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['vite/**/*.{js,mjs}', 'scripts/**/*.{js,mjs}', '*.config.{js,mjs}'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  prettierConfig,
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'ios/**',
      'public/sw.js', // contiene `self` que es WorkerGlobal, no Window
      'public/register-sw.js',
    ],
  },
]
