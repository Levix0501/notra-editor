import { Command } from 'commander';
import { initCommand } from './commands/init';

const program = new Command();

program
  .name('notra-editor')
  .version('1.0.0')
  .description('CLI tool to scaffold notra-editor into your project');

program
  .command('init')
  .description('Initialize notra-editor in your project')
  .option('-f, --force', 'Overwrite existing files without prompting')
  .action(async (options) => {
    await initCommand({ force: options.force });
  });

program.parse();
