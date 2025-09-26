# accessible-a11y-cli

![npm version](https://img.shields.io/npm/v/accessible-a11y-cli?style=flat-square)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)
![GitHub stars](https://img.shields.io/github/stars/Hermit-commits-code/accessible-a11y-cli?style=social)

⭐️ If you find this project useful, please consider starring it on [GitHub](https://github.com/Hermit-commits-code/accessible-a11y-cli)!

**A robust, developer-friendly CLI for automated accessibility testing and autofix of HTML and JSX files using axe-core.**

## 📚 Table of Contents

- [What's New](#-whats-new-in-140)
- [Roadmap](#-roadmap)
- [Vision](#-vision)
- [Installation](#-installation)
- [Usage](#-usage)
- [Testing & Reliability](#-testing--reliability)
- [Example](#-example)
- [Contributing](#-contributing)

---

## 🚀 What's New in 1.6.0

**Major autofix engine upgrade!**

- **Customizable Markdown/HTML templates!**
  - Use `--template <file>` to provide your own Markdown or HTML template for output reports.
  - Templates support `{{results}}` (inserts formatted results for each file) and `{{json}}` (inserts the full JSON output).
  - Example usage:
    ```bash
    a11y-check check test.html --format markdown --template my-template.md --output report.md
    ```

- Now supports 8 high-impact autofix rules:
  1. Add/fix `<html lang>`
  2. Add/fix `<title>`
  3. Add `<main>` landmark
  4. Add `<h1>` heading
  5. Add missing `alt` attributes to images
  6. Add missing accessible name to buttons/links
  7. Add table headers if missing
  8. Fix duplicate IDs
- Expanded and improved unit and integration tests for all new autofix rules
- Markdown output support for both results and autofix logs (`--format markdown`)
- All output formats (table, JSON, HTML, Markdown) are now robust and fully tested

---

## 🚀 What's New in 1.3.1

- Robust CLI integration tests for output/logging (table, JSON, HTML)
- Fixed: CLI now outputs autofix logs in the requested format when --fix and --output are used
- Improved documentation and test coverage for output formatting

## 🚀 What's New in 1.1.4

- Expanded robust test file with more accessibility issues for better coverage
- Improved dry-run default for --fix (now requires --no-fix-dry-run to write changes)

## 🚀 What's New in 1.1.3

- Fail-safe file handling: always creates a backup before fixing, and --fix-dry-run is now the default for --fix

## 🚀 What's New in 1.1.1

- CLI output and UX improvements: clearer logs, more context in autofix logs, improved error/warning messages, and enhanced summary formatting

## 🚀 What's New in 1.0.0

- Advanced autofix logic for alt, lang, labels, headings, ARIA, color contrast, tabindex, skip links, semantic HTML, and link text
- Comprehensive, reliable unit tests for all autofix logic
- Cleaned up legacy and redundant test files for maintainability
- Ready for production and open source use

---

## 🗺️ Roadmap

- [x] Advanced autofix logic for accessibility issues
- [x] Robust CLI output and logging (table, JSON, HTML, Markdown)
- [x] Fail-safe file handling and dry-run
- [x] Configurable rules and output formats
- [x] Markdown output support for results and autofix logs
- [x] Customizable Markdown/HTML templates
- [ ] HTML output improvements (planned)

## 🚀 Vision

`accessible-a11y-cli` aims to make accessibility testing simple, fast, and part of every developer's workflow. By leveraging [axe-core](https://github.com/dequelabs/axe-core), this tool helps you catch and fix accessibility issues early, ensuring your web projects are usable by everyone.

## 📦 Installation

```bash
npm install -g accessible-a11y-cli
```

## 🛠️ Usage

Run accessibility checks on one or more HTML/JSX files or remote URLs:

```bash
a11y-check check path/to/file.html path/to/other.jsx https://example.com
```

### Output Formats & Rule Configuration

- Output and autofix logs can be saved in `table`, `json`, or `html` formats using `--format`.
- Use `--output <file>` to save results and logs to a file.
- Enable or disable specific rules with `--rules` and `--disable-rule` (comma-separated list).
- All output formats are supported for both results and autofix logs.

### Options

- `--template <file>` Use a custom Markdown or HTML template for output (supports `{{results}}` and `{{json}}`)

- `-f, --format <type>` Output format: `table` (default), `json`, or `html`
- `-o, --output <file>` Save results to a file
- `--fix` Attempt to auto-fix common accessibility issues (now covers: lang, title, main, h1, image alt, button/link name, table headers, duplicate IDs)
- `--fix-dry-run` Show what would be fixed without changing files
- `--verbose` Verbose output

You can mix local file paths and URLs in a single command. URLs must start with `http://` or `https://`.

---

## 🧪 Testing & Reliability

This CLI is backed by robust unit tests for all autofix logic. Run `npm test` to verify reliability and coverage. You can also use CLI-level tests to check real file output.

---

## 💡 Example

# Example custom Markdown template (my-template.md):

````
# My Custom Accessibility Report

{{results}}

---
Full JSON output:
```json
{{json}}
````

````

```bash
# Check a local file, a JSX file, and a remote URL
a11y-check check test/test.html src/App.jsx https://example.com

# Autofix and save to a new file (with backup)
a11y-check check --fix -o fixed.html test/test.html

# Dry run (see what would be fixed, but don’t write)
a11y-check check --fix-dry-run test/test.html

# Output results as JSON and save to a file
a11y-check check https://example.com --format json --output results.json

# Output autofix log as HTML
a11y-check check --fix --format html --output autofix-log.html test/test.html

# Output autofix log as table (plain text)
a11y-check check --fix --format table --output autofix-log.txt test/test.html

# Disable specific rules and output as JSON
a11y-check check --fix --disable-rule=region,tabindex --format json --output autofix-log.json test/test.html
````

## 🤝 Contributing

Contributions are welcome! Please open issues or pull requests for bugs, features, or improvements.

1. Fork the repo and create your branch
2. Run `npm install` to set up dependencies
3. Add tests for new features
4. Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages
5. Open a pull request and describe your changes

_This project is not affiliated with Deque Systems. "axe-core" is a trademark of Deque Systems, Inc._
