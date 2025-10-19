import { dirname } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { validateEnvironment } from '../../config/env-validator.js';
import { FileSystemUtils, logger } from '../../utils/index.js';
import { OracleClient } from '../../library/oracle-client.js';
import { LLMService } from '../../genesis/llm-service.js';
import { handleCommandError, runWithRetry } from '../utils/error-handler.js';

interface HealthCheckResult {
  name: string;
  status: 'pass' | 'warn' | 'fail' | 'skip';
  detail?: string;
}

export async function healthCommand(): Promise<void> {
  const spinner = ora('Running system health checks...').start();
  const results: HealthCheckResult[] = [];

  try {
    const envConfig = validateEnvironment();
    results.push({ name: 'Environment variables', status: 'pass', detail: 'All required variables present' });

    spinner.text = 'Validating database path...';
    try {
      const dbDir = dirname(envConfig.DB_PATH);
      await FileSystemUtils.ensureDir(dbDir);
      results.push({ name: 'Database path', status: 'pass', detail: envConfig.DB_PATH });
    } catch (error) {
      results.push({ name: 'Database path', status: 'fail', detail: (error as Error).message });
    }

    spinner.text = 'Checking ORACLE service availability...';
    const oracleClient = new OracleClient();
    try {
      const healthy = await oracleClient.isHealthy();
      results.push({
        name: 'ORACLE service',
        status: healthy ? 'pass' : 'warn',
        detail: healthy ? 'Service responded to health check' : 'ORACLE did not respond - start with `brandos oracle start`',
      });
    } catch (error) {
      results.push({
        name: 'ORACLE service',
        status: 'fail',
        detail: (error as Error).message,
      });
    }

    spinner.text = 'Testing LLM connectivity...';
    const offlineMode = (process.env['BRANDOS_OFFLINE'] || '').toLowerCase() === 'true';
    if (envConfig.DEFAULT_LLM_PROVIDER === 'mock' || offlineMode) {
      results.push({
        name: 'LLM connectivity',
        status: 'skip',
        detail: 'Offline or mock mode enabled',
      });
    } else {
      try {
        const llm = new LLMService({ temperature: 0, maxTokens: 20 });
        await runWithRetry('health:llm', () =>
          llm.prompt(
            'Health check ping',
            'You are verifying system connectivity. Respond with the word OK.',
            { maxTokens: 5, temperature: 0 }
          )
        );
        results.push({ name: 'LLM connectivity', status: 'pass', detail: `Provider: ${envConfig.DEFAULT_LLM_PROVIDER}` });
      } catch (error) {
        logger.warn('LLM health check failed', error as Error);
        results.push({
          name: 'LLM connectivity',
          status: 'warn',
          detail: (error as Error).message,
        });
      }
    }

    spinner.succeed(chalk.green('Health checks completed'));

    console.log(chalk.bold('\nSystem Health Summary:'));
    for (const result of results) {
      const prefix =
        result.status === 'pass' ? chalk.green('✓') :
          result.status === 'warn' ? chalk.yellow('!') :
            result.status === 'skip' ? chalk.cyan('-') : chalk.red('✗');
      console.log(`${prefix} ${result.name} — ${result.detail ?? result.status}`);
    }

    const failed = results.filter(result => result.status === 'fail');
    const warned = results.filter(result => result.status === 'warn');

    if (failed.length === 0 && warned.length === 0) {
      console.log(chalk.green('\nAll systems operational.'));
    } else {
      if (failed.length > 0) {
        console.log(chalk.red(`\nFailures (${failed.length}):`));
        failed.forEach(result => console.log(chalk.red(` - ${result.name}: ${result.detail}`)));
      }
      if (warned.length > 0) {
        console.log(chalk.yellow(`\nWarnings (${warned.length}):`));
        warned.forEach(result => console.log(chalk.yellow(` - ${result.name}: ${result.detail}`)));
      }
    }

  } catch (error) {
    handleCommandError('health', error, spinner);
  }
}
