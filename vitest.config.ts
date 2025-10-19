import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Ensure tests write inside the repo workspace to avoid sandbox/home perms
    env: {
      // Redirect HOME for tests to a workspace-local path so anything
      // using os.homedir() writes inside the repo (sandbox-friendly)
      HOME: path.join(process.cwd(), '.home'),
      // And provide explicit BRANDOS_HOME to align code paths
      BRANDOS_HOME: path.join(process.cwd(), '.home', '.brandos'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'src/types/**',
      ],
    },
    testTimeout: 30000, // 30 seconds for tests with network calls
    hookTimeout: 30000,
  },
});
