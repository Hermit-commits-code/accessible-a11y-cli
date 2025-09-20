#!/usr/bin/env node

const { program } = require('commander');
const fs = require('fs');
const chalk = require('chalk');
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
  .option('--fix', 'attempt to auto-fix common accessibility issues')
  .option('--fix-dry-run', 'show what would be fixed without changing files')
  .option('--verbose', 'verbose output')
  .option('--debug', 'debug output (implies verbose)')
  .action(async (files, options) => {
    const { AccessibilityChecker } = require('../src/index.js');
    // Support --debug as a superset of --verbose
    if (options.debug) options.verbose = true;
    const checker = new AccessibilityChecker(options);
    try {
      if (options.fix) options.fix = true;
      if (options.fixDryRun) options.fixDryRun = true;
      const results = await checker.checkFiles(files);
      const output = checker.formatResults(results, options.format);
      if (options.output) {
        // If autofix and output, write fixed HTML for the first file (single-file use case)
        if (
          options.fix &&
          results.length === 1 &&
          results[0].autofix &&
          !results[0].error
        ) {
          // Write the fixed HTML
          const { JSDOM } = require('jsdom');
          const content = await fs.promises.readFile(results[0].file, 'utf8');
          const dom = new JSDOM(content);
          await fs.promises.writeFile(options.output, dom.serialize(), 'utf8');
          console.log(chalk.green(`💾 Fixed HTML saved to: ${options.output}`));
        } else {
          await checker.saveResults(results, options.output, options.format);
        }
      }
      console.log(output);
      let totalFixed = 0;
      let totalSkipped = 0;
      let totalFiles = results.length;
      for (const result of results) {
        const fileLabel = chalk.cyan.bold(result.file);
        console.log(chalk.yellow('🛠️  Autofix log for'), fileLabel + ':');
        if (result.autofixLog && result.autofixLog.length > 0) {
          for (const msg of result.autofixLog) {
            // If verbose/debug, show all log lines, including context
            if (options.verbose && msg.startsWith('[autofix-debug]')) {
              console.log(chalk.magenta('  🐞 ' + msg));
              continue;
            }
            if (
              msg.toLowerCase().includes('added') ||
              msg.toLowerCase().includes('fixed')
            ) {
              totalFixed++;
              console.log(chalk.green('  ✔ ' + msg));
            } else if (
              msg.toLowerCase().includes('skipped') ||
              msg.toLowerCase().includes('already')
            ) {
              totalSkipped++;
              console.log(chalk.yellow('  ⚠ ' + msg));
            } else {
              if (options.verbose) {
                console.log(chalk.gray('  ' + msg));
              }
            }
          }
        } else {
          totalSkipped++;
          console.log(chalk.gray('  (No autofix actions performed)'));
        }
      }
      // Summary
      console.log();
      console.log(chalk.bold('Summary:'));
      console.log(chalk.green(`  ✔ Fixed: ${totalFixed}`));
      console.log(chalk.yellow(`  ⚠ Skipped/No action: ${totalSkipped}`));
      console.log(chalk.cyan(`  📄 Files processed: ${totalFiles}`));
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
