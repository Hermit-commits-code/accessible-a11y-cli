#!/usr/bin/env node

const { program } = require('commander');
const { Chalk } = require('chalk');
const chalk = new Chalk();
const figlet = require('figlet');
const { version } = require('../package.json');

// Display welcome banner
console.log(
  chalk.green(figlet.textSync('A11y CLI', { horizontalLayout: 'full' }))
);

console.log(chalk.blue('🌟 Accessible A11y CLI ready!'));
console.log(chalk.gray(`Version ${version}`));
console.log();

// Set up CLI program
program
  .name('a11y-check')
  .description('CLI tool for accessibility testing using axe-core')
  .version(version);

// Check command
program
  .command('check <inputs...>')
  .description('Run accessibility checks on HTML/JSX files or URLs')
  .option('-f, --format <type>', 'output format (json, table, html)', 'table')
  .option('-o, --output <file>', 'output file path')
  .option('--fix', 'attempt to auto-fix common issues')
  .option('--verbose', 'verbose output')
  .action(async (files, options) => {
    const { AccessibilityChecker } = require('../src/index.js');
    const checker = new AccessibilityChecker(options);
    try {
      const results = await checker.checkFiles(files);
      const output = checker.formatResults(results, options.format);
      if (options.output) {
        await checker.saveResults(results, options.output, options.format);
      }
      console.log(output);
    } catch (err) {
      console.error(
        chalk.red('❌ Error running accessibility checks:'),
        err.message
      );
      process.exit(1);
    }
  });

// Init command
program
  .command('init')
  .description('Initialize accessibility configuration')
  .action(() => {
    console.log(chalk.blue('📋 Initializing accessibility configuration...'));
    // TODO: Create config file
    console.log(
      chalk.green('✅ Configuration initialized! (Not implemented yet)')
    );
  });

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
