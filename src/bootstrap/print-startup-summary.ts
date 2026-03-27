import * as colors from 'colors';

export type DatabaseStartupStatus = 'connected' | 'failed';

export function printStartupSummary(options: {
  nodeEnv: string;
  port: number;
  baseUrl: string;
  swaggerUrl: string;
  database: DatabaseStartupStatus;
}): void {
  const label = (text: string) => colors.white(text.padEnd(14, ' '));
  const divider = colors.dim('  ' + '─'.repeat(58));

  const dbLine =
    options.database === 'connected'
      ? `${colors.green('●')} ${colors.green('Connected')}`
      : `${colors.red('●')} ${colors.red('Connection check failed')}`;

  console.log('');
  console.log(colors.cyan.bold('  Access Sellr API'));
  console.log(colors.dim('  Production-ready REST services'));
  console.log(divider);
  console.log(`  ${label('NODE_ENV')}${colors.yellow(options.nodeEnv)}`);
  console.log(
    `  ${label('HTTP server')}${colors.green(`listening on port ${options.port}`)}`,
  );
  console.log(`  ${label('Public base')}${colors.dim(options.baseUrl)}`);
  console.log(`  ${label('Database')}${dbLine}`);
  console.log(
    `  ${label('Swagger UI')}${colors.blue(colors.underline(options.swaggerUrl))}`,
  );
  console.log(divider);
  console.log(colors.dim('  Ready to accept requests.'));
  console.log('');
}
