// ESLint flat config for TypeScript (ESLint v9+)
import parser from '@typescript-eslint/parser';
import plugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': plugin,
    },
    rules: {
      // Prefer TS-aware unused var rule
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          // Don't flag unused catch error parameters; avoid noisy warnings
          caughtErrors: 'none',
        },
      ],
      // Handled by TS types
      'no-undef': 'off',
    },
  },
];
