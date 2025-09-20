
## [0.5.0] - 2025-09-20

### Added

- Improved autofix logic: more robust context-aware DOM fixes
- Debug output for autofix actions (see CLI output)
- Ensured backup and restoration of original files
- Internal refactoring for extensibility of autofix rules

## [0.4.0] - 2025-09-20

### Added

- Advanced autofix support: `--fix` and `--fix-dry-run` flags
- Automatically adds missing `alt` and `lang` attributes (more autofixes coming)
- Backs up original files before fixing
- Improved CLI output for autofix actions

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-09-20

### Added

- URL scanning support: check remote URLs in addition to local files
- Updated CLI, README, and dependencies

## [0.2.0] - 2025-09-19

### Added

- Robust axe-core integration for accessibility checks
- HTML and JSX file parsing and reporting
- Readable CLI output for accessibility violations
- Chalk v5+ compatibility and color output fixes
- Bug fixes for jsdom/axe-core integration

## [0.1.0] - 2025-09-19

### Added

- Initial CLI scaffold
- Project structure and documentation
- Placeholder for accessibility checking using axe-core
