# CI/CD Pipeline Documentation

## 🚀 GitHub Actions Workflows

This project uses GitHub Actions for automated CI/CD. Three main workflows are configured:

### 1. **CI Pipeline** (`ci.yml`)

**Triggers:** Push to any branch, Pull Requests to `main`/`develop`

**Jobs:**

- ✅ **Install Dependencies** - Caches node_modules for faster builds
- ✅ **Lint** - Runs ESLint across the codebase
- ✅ **Type Check** - Validates TypeScript types
- ✅ **Format Check** - Ensures code follows Prettier formatting
- ✅ **Backend Tests** - Runs all backend tests with coverage
- ✅ **Build Backend** - Compiles TypeScript to JavaScript
- ✅ **Security Audit** - Checks for vulnerable dependencies

**Coverage Reports:**

- Uploaded to Codecov (requires `CODECOV_TOKEN` secret)
- Artifacts stored for 30 days

### 2. **Deploy Backend** (`deploy-backend.yml`)

**Triggers:**

- Push to `main` branch (backend changes only)
- Manual workflow dispatch

**Jobs:**

- ✅ **Test** - Runs full test suite with coverage
- ✅ **Build** - Creates production build
- ✅ **Deploy** - Deploys to production environment
- ✅ **Health Check** - Verifies deployment success

**Environment:** `production`

**Deployment Options:**

- Railway (commented example)
- Docker (commented example)
- Custom deployment script

### 3. **PR Checks** (`pr-checks.yml`)

**Triggers:** Pull request opened/updated

**Jobs:**

- 📋 **PR Info** - Displays PR details
- ✅ **Validate** - Quick lint, type, format checks
- ✅ **Test Backend** - Runs tests with coverage
- 💬 **Coverage Comment** - Posts coverage report on PR
- ✅ **Build** - Ensures build succeeds
- 📊 **Status Summary** - Overall PR health check

## 📊 Coverage Requirements

Minimum thresholds (from `vitest.config.ts`):

- Lines: **56%**
- Functions: **68%**
- Branches: **43%**
- Statements: **56%**

Current coverage: **56.19%** overall ✅

## 🔧 Setup Instructions

### Required Secrets

Add these to your GitHub repository secrets:

1. **`CODECOV_TOKEN`** (optional)
   - Get from [codecov.io](https://codecov.io)
   - For coverage reporting

2. **Deployment secrets** (choose one):
   - `RAILWAY_TOKEN` - For Railway deployment
   - Docker registry credentials
   - Cloud provider credentials (AWS/GCP/Azure)

### Setting up secrets:

1. Go to: `Settings` → `Secrets and variables` → `Actions`
2. Click `New repository secret`
3. Add required secrets

## 🏃‍♂️ Running Locally

Test CI checks locally before pushing:

```bash
# Install dependencies
pnpm install

# Run linting
pnpm lint

# Run type checking
pnpm type-check

# Check formatting
pnpm format:check

# Run tests with coverage
pnpm test:coverage

# Build project
pnpm build
```

## 🎯 Workflow Features

### Caching

- Dependencies cached between runs
- 50-80% faster CI execution
- Automatic cache invalidation on lock file changes

### Parallel Execution

- Independent jobs run in parallel
- Average CI time: ~3-5 minutes
- Sequential jobs only when dependencies exist

### Artifacts

- **Coverage reports**: 30 days retention
- **Build artifacts**: 7 days retention
- Available for download from workflow runs

### Branch Protection

Recommended settings for `main` branch:

1. Require PR before merging
2. Require status checks:
   - `Lint Code`
   - `Type Check`
   - `Backend Tests`
   - `Build Backend`
3. Require up-to-date branches
4. Require conversation resolution

## 📈 Coverage Reporting

Coverage reports are:

1. Generated during test runs
2. Uploaded as artifacts (HTML + JSON)
3. Posted as PR comments
4. Sent to Codecov (if configured)

Access reports:

- **PR Comments**: Automatic on each PR
- **Artifacts**: Download from workflow run
- **Codecov**: View trends at codecov.io

## 🐛 Troubleshooting

### Build fails with "Module not found"

- Clear cache: Delete old workflow runs
- Check `pnpm-lock.yaml` is committed
- Verify all dependencies are in `package.json`

### Tests fail in CI but pass locally

- Check Node.js version matches (18.x)
- Verify environment variables
- Check timezone differences

### Coverage threshold failures

- Update thresholds in `vitest.config.ts`
- Or add more tests to increase coverage

## 🔄 Continuous Improvement

Monitor your CI/CD:

- Check workflow run times
- Review failed builds
- Update dependencies regularly
- Optimize slow tests
- Add more test coverage

## 📝 Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Coverage thresholds met
- [ ] No linting errors
- [ ] Types validate
- [ ] Code formatted
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Health checks working

## 🎉 Success Criteria

A successful CI/CD run requires:

- ✅ All lint rules pass
- ✅ No TypeScript errors
- ✅ Code properly formatted
- ✅ 199 tests passing
- ✅ 56%+ coverage maintained
- ✅ Build completes successfully
- ✅ No critical security vulnerabilities
