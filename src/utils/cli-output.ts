/**
 * CLI Output Utility
 *
 * Centralized user-facing output for CLI commands.
 * Respects verbosity settings and provides consistent formatting.
 *
 * USAGE GUIDE:
 * - Use this for user-facing CLI output (progress, results, messages)
 * - Use Logger for internal/debug logging and error tracking
 * - Console.log with chalk is CORRECT for CLI tools
 */

import chalk from 'chalk';

interface OutputOptions {
  quiet?: boolean;
  verbose?: boolean;
}

class CLIOutput {
  private options: OutputOptions;

  constructor(options: OutputOptions = {}) {
    this.options = options;
  }

  /**
   * Set output options (e.g., from CLI flags)
   */
  setOptions(options: OutputOptions): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * User-facing success message
   */
  success(message: string): void {
    if (!this.options.quiet) {
      console.log(chalk.green(message));
    }
  }

  /**
   * User-facing error message
   */
  error(message: string, error?: Error): void {
    // Always show errors (even in quiet mode)
    console.error(chalk.red(message));
    if (error && this.options.verbose) {
      console.error(chalk.dim(error.stack || error.message));
    }
  }

  /**
   * User-facing warning message
   */
  warn(message: string): void {
    if (!this.options.quiet) {
      console.log(chalk.yellow(message));
    }
  }

  /**
   * User-facing info message
   */
  info(message: string): void {
    if (!this.options.quiet) {
      console.log(chalk.cyan(message));
    }
  }

  /**
   * Debug/verbose output (only shown with --verbose)
   */
  debug(message: string): void {
    if (this.options.verbose) {
      console.log(chalk.dim(message));
    }
  }

  /**
   * Plain output (no formatting, respects quiet mode)
   */
  log(message: string): void {
    if (!this.options.quiet) {
      console.log(message);
    }
  }

  /**
   * Blank line (for spacing)
   */
  blank(): void {
    if (!this.options.quiet) {
      console.log();
    }
  }

  /**
   * Bold header
   */
  header(message: string): void {
    if (!this.options.quiet) {
      console.log(chalk.bold(message));
    }
  }

  /**
   * Dim/gray text
   */
  dim(message: string): void {
    if (!this.options.quiet) {
      console.log(chalk.dim(message));
    }
  }
}

// Global CLI output instance
export const cliOutput = new CLIOutput();

/**
 * Usage Examples:
 *
 * // User-facing messages (CORRECT)
 * cliOutput.success('✅ Brand initialized successfully');
 * cliOutput.error('❌ Failed to load config', error);
 * cliOutput.info('📊 Analyzing competitors...');
 *
 * // Internal logging (use Logger instead)
 * import { logger } from './logger.js';
 * logger.info('Internal state updated', { brand, phase });
 * logger.error('API call failed', error);
 */
