# Monorepo Setup with Turbo

This monorepo contains a Fastify backend and React Native mobile app with shared tooling for linting, formatting, and development.

## 🛠 Tech Stack

- **Monorepo Tool**: Turbo
- **Package Manager**: pnpm (with npm compatibility)
- **Backend**: Fastify (TypeScript)
- **Frontend**: React Native (TypeScript)
- **Linting**: ESLint with flat config
- **Formatting**: Prettier
- **Git Hooks**: Husky + lint-staged
- **Commit Standards**: Conventional Commits + Gitmoji
- **Commit Validation**: Commitlint

## 📁 Project Structure

```
├── apps/
│   ├── backend/          # Fastify API server
│   └── mobile/           # React Native app
├── packages/             # Shared packages (future)
├── .husky/               # Git hooks
│   ├── pre-commit        # Linting, formatting, type checking
│   ├── commit-msg        # Commit message validation
│   ├── pre-push          # Full build and lint before push
│   └── post-checkout     # Dependency change notifications
├── turbo.json           # Turbo configuration
├── eslint.config.js     # ESLint flat config
├── commitlint.config.js # Commit message validation
├── .gitmoji             # Gitmoji configuration
├── .prettierrc          # Prettier configuration
└── package.json         # Root package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0 (or npm if preferred)

### Installation

1. **Clone and install dependencies**:

   ```bash
   pnpm install
   ```

2. **Set up git hooks**:
   ```bash
   pnpm prepare
   chmod +x .husky/*  # Make hooks executable (Unix/Mac)
   ```

### Development Commands

- **Start development servers**: `pnpm dev`
- **Build all apps**: `pnpm build`
- **Lint all code**: `pnpm lint`
- **Fix linting issues**: `pnpm lint:fix`
- **Format all code**: `pnpm format`
- **Type check**: `pnpm type-check`
- **Clean build artifacts**: `pnpm clean`

## 📝 Commit Standards

### Conventional Commits + Gitmoji

We use a combination of conventional commits and gitmoji for clear, expressive commit messages.

#### Valid Commit Formats:

```bash
# With gitmoji and conventional type
🎉 feat(backend): add user authentication
🐛 fix(mobile): resolve navigation crash
📚 docs(api): update endpoint documentation
🎨 style(ui): improve button component styling

# Conventional commits only
feat(auth): implement OAuth login
fix(database): resolve connection timeout
docs: add deployment instructions
```

#### Commit Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style/formatting
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `build`: Build system changes

#### Scopes:

- **Apps**: `backend`, `mobile`, `shared`
- **Features**: `auth`, `api`, `ui`, `navigation`, `database`
- **Tools**: `config`, `build`, `ci`, `docs`, `deps`, `lint`, `test`

### Interactive Commit Tools

1. **Commitizen (guided commits)**:

   ```bash
   pnpm commit
   ```

2. **Gitmoji CLI (emoji selection)**:
   ```bash
   pnpm gitmoji
   ```

## 🔒 Git Hooks

### Pre-commit

- ✅ Runs lint-staged (ESLint + Prettier)
- ✅ Type checking across all projects
- ⚠️ Warns about TODO/FIXME comments
- ⚠️ Warns about console.log statements

### Commit-msg

- ✅ Validates commit message format
- ✅ Enforces conventional commits + gitmoji
- ✅ Provides helpful examples on failure

### Pre-push

- ✅ Runs full build to ensure compilation
- ✅ Runs complete linting suite
- ⚠️ Warns when pushing to protected branches

### Post-checkout

- 📦 Notifies about dependency changes
- 🔧 Alerts about environment variable updates
- 📋 Shows recent commits on new branch

## 🎨 Code Quality

### Automated Checks

- **ESLint** with TypeScript, React, and React Native rules
- **Prettier** with standard configuration
- **Import sorting** and organization
- **Type checking** on every commit
- **Build validation** before push

### Standards Enforced

- Consistent code formatting
- Import organization and sorting
- TypeScript strict mode
- Conventional commit messages
- No stray console.log statements
- TODO/FIXME tracking

## 📱 Mobile App (React Native/Expo)

Navigate to `apps/mobile/` to set up your Expo app:

```bash
cd apps/mobile
npx create-expo-app@latest . --template blank-typescript --yes
```

Then run:

- **Start**: `pnpm start`
- **iOS**: `pnpm ios`
- **Android**: `pnpm android`
- **Web**: `pnpm web`

## 🔧 Backend (Fastify)

The backend is already set up with a basic Fastify server.

Run in development:

```bash
cd apps/backend
pnpm dev
```

## 🤝 Team Development Workflow

1. **Start new feature**:

   ```bash
   git checkout -b feat/user-authentication
   ```

2. **Make changes and commit**:

   ```bash
   git add .
   pnpm commit  # Interactive commit with validation
   ```

3. **Push changes**:
   ```bash
   git push  # Triggers pre-push validation
   ```

## 🛠 Customization

### Adding New Scopes

Edit `commitlint.config.js` and `.gitmoji` to add project-specific scopes.

### Modifying Git Hooks

Edit files in `.husky/` directory to customize hook behavior.

### ESLint Rules

Modify `eslint.config.js` to adjust linting rules per project needs.

## 🚀 Next Steps

1. Set up your Fastify server in `apps/backend/src/`
2. Initialize your Expo app in `apps/mobile/`
3. Create shared packages in `packages/` as needed
4. Configure environment variables
5. Set up CI/CD pipelines with the same validation rules

The monorepo ensures consistent code quality, clear commit history, and smooth team collaboration! 🎉
