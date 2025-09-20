# accessible-a11y-cli

![npm version](https://img.shields.io/npm/v/accessible-a11y-cli?style=flat-square)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/Hermit-commits-code/accessible-a11y-cli/ci.yml?branch=main&style=flat-square)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)

> **A robust, developer-friendly CLI for automated accessibility testing and autofix of HTML and JSX files using axe-core.**

---

## 🚀 Why Use This CLI?

- **Comprehensive autofix** for alt, lang, labels, headings, ARIA, color contrast, tabindex, skip links, semantic HTML, and link text
- **Idempotent, context-aware fixes**—safe to run multiple times
- **Extensive unit and CLI tests** for every autofix rule and edge case
- **Clear, actionable CLI output** with color, symbols, and summaries
- **Rich logging and verbosity options** for troubleshooting
- **Fail-safe file handling**: always backs up originals, supports dry-run
- **Configurable rules and output formats** (table, JSON, HTML)
- **Great developer experience**: fast, reliable, easy to use, and CI/CD ready

---

## 🚀 What's New in 1.1.1

- CLI output and UX improvements: clearer logs, more context in autofix logs, improved error/warning messages, and enhanced summary formatting

## 🚀 What's New in 1.0.0

- Advanced autofix logic for alt, lang, labels, headings, ARIA, color contrast, tabindex, skip links, semantic HTML, and link text
- Comprehensive, reliable unit tests for all autofix logic
- Cleaned up legacy and redundant test files for maintainability
- Ready for production and open source use

---

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

### Options

- `-f, --format <type>` Output format: `table` (default), `json`, or `html`
- `-o, --output <file>` Save results to a file
- `--fix` Attempt to auto-fix common accessibility issues (alt, lang, labels, headings, ARIA, color contrast, tabindex, skip links, semantic HTML, link text)
- `--fix-dry-run` Show what would be fixed without changing files
- `--verbose` Verbose output

You can mix local file paths and URLs in a single command. URLs must start with `http://` or `https://`.

---

## 🧪 Testing & Reliability

This CLI is backed by robust unit tests for all autofix logic. Run `npm test` to verify reliability and coverage. You can also use CLI-level tests to check real file output.

---

## 💡 Example

```bash
# Check a local file, a JSX file, and a remote URL
a11y-check check test/test.html src/App.jsx https://example.com

# Autofix and save to a new file (with backup)
a11y-check check --fix -o fixed.html test/test.html

# Dry run (see what would be fixed, but don’t write)
a11y-check check --fix-dry-run test/test.html

# Output results as JSON and save to a file
a11y-check check https://example.com --format json --output results.json
```

## 🗺️ Roadmap

- [x] CLI scaffold and project setup
- [x] Integrate axe-core for accessibility checks
- [x] Parse HTML/JSX and report issues in readable format
- [x] Support CLI flags: format, fix, output
- [x] Add URL scanning support
- [x] Add autofix for common issues (alt, lang, more coming)
- [ ] Markdown/code output support
- [ ] CI/CD integration and npm release
- [ ] Collect feedback and iterate

## 🤝 Contributing

Contributions are welcome! Please open issues or pull requests for bugs, features, or improvements.

1. Fork the repo and create your branch
2. Run `npm install` to set up dependencies
3. Add tests for new features
4. Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages
5. Open a pull request and describe your changes

## 📄 License

MIT © Hermit-commits-code

---

_This project is not affiliated with Deque Systems. "axe-core" is a trademark of Deque Systems, Inc._
