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
  .option(
    '--rules <list>',
    'comma-separated list of rules to enable (e.g. image-alt,label,region)'
  )
  .option(
    '--disable-rule <list>',
    'comma-separated list of rules to disable (e.g. color-contrast,tabindex)'
  )
  .option('-o, --output <file>', 'output file path')
  .option('--fix', 'attempt to auto-fix common accessibility issues')
  .option(
    '--fix-dry-run',
    'show what would be fixed without changing files (default: true when --fix is set)'
  )
  .option('--no-fix-dry-run', 'actually write fixes to disk (use with --fix)')
  .option('--verbose', 'verbose output')
  .option('--debug', 'debug output (implies verbose)')
  .action(async (files, options) => {
    const { AccessibilityChecker } = require('../src/index.js');
    if (options.debug) options.verbose = true;
    if (options.fix) {
      options.fix = true;
      if (typeof options.fixDryRun === 'undefined') {
        options.fixDryRun = true;
      }
      if (options.noFixDryRun) {
        options.fixDryRun = false;
      }
    }
    if (options.rules) {
      options.rules = options.rules
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);
    }
    if (options.disableRule) {
      options.disableRule = options.disableRule
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);
    }
    const checker = new AccessibilityChecker(options);
    try {
      const results = await checker.checkFiles(files);
      let output;
      // If --fix and --output, output autofix log in requested format
      if (options.output && options.fix) {
        await checker.saveResults(
          results,
          options.output,
          options.format,
          true
        );
        output = checker.formatResults(results, options.format, true);
        console.log(chalk.green(`💾 Autofix log saved to: ${options.output}`));
      } else if (options.output) {
        await checker.saveResults(results, options.output, options.format);
        output = checker.formatResults(results, options.format);
        console.log(chalk.green(`💾 Results saved to: ${options.output}`));
      } else {
        output = checker.formatResults(results, options.format, !!options.fix);
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
