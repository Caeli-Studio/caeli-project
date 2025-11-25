# GitHub Actions CI

This directory contains the GitHub Actions CI workflows for the Caeli project.

## Workflows

### 🔄 CI (`ci.yml`)

**Trigger:** Push to `main`/`develop`, Pull Requests

Main continuous integration workflow that runs on every push and pull request:

- **Lint**: Runs ESLint and Prettier formatting checks
- **Type Check**: Validates TypeScript types across the monorepo
- **Test**: Runs all tests and generates coverage reports
- **Build**: Builds the backend application

The workflow runs jobs in parallel where possible and uses caching to speed up execution.

### 🎯 PR Checks (`pr-checks.yml`)

**Trigger:** Pull Request events

Validates pull requests:

- **PR Title Check**: Ensures PR titles follow conventional commits format (feat, fix, docs, etc.)
- **Size Labeler**: Automatically labels PRs based on size (xs, s, m, l, xl)

## Setup

### Required Secrets (Optional)

- **CODECOV_TOKEN**: For uploading test coverage to Codecov
  - Go to Settings → Secrets and variables → Actions
  - Add a new repository secret named `CODECOV_TOKEN`
  - Get the token from [codecov.io](https://codecov.io/)

### Labels

The PR size labeler uses these labels (create them in your repository):

- `size/xs` - Very small changes (< 10 lines)
- `size/s` - Small changes (< 100 lines)
- `size/m` - Medium changes (< 500 lines)
- `size/l` - Large changes (< 1000 lines)
- `size/xl` - Very large changes (> 1000 lines)

## Status Badges

Add this badge to your main README.md:

```markdown
[![CI](https://github.com/Caeli-Studio/caeli-project/workflows/CI/badge.svg)](https://github.com/Caeli-Studio/caeli-project/actions/workflows/ci.yml)
```

## Troubleshooting

### Workflow Failures

**Lint failures:**

- Run `pnpm lint:fix` locally to auto-fix issues
- Run `pnpm format` to fix formatting

**Type check failures:**

- Run `pnpm type-check` locally
- Fix any TypeScript errors

**Test failures:**

- Run `pnpm test` locally
- Check test output for specific failures

**Build failures:**

- Run `pnpm build` locally
- Ensure all dependencies are installed with `pnpm install`

## Local Testing

Before pushing, run these commands locally:

```bash
# Install dependencies
pnpm install

# Run all CI checks
pnpm lint
pnpm format:check
pnpm type-check
pnpm test
pnpm build
```
