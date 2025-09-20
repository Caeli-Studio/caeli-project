module.exports = {
  extends: ['@commitlint/config-conventional'],

  rules: {
    // Allow gitmoji in subject
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],

    // Custom rules for better commit messages
    'header-max-length': [2, 'always', 100],
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always'],

    // Scope validation
    'scope-enum': [
      2,
      'always',
      [
        // App scopes
        'backend',
        'mobile',
        'shared',

        // Feature scopes
        'auth',
        'api',
        'ui',
        'navigation',
        'database',
        'config',
        'build',
        'ci',
        'docs',
        'deps',
        'release',

        // General scopes
        'lint',
        'format',
        'test',
        'perf',
        'security',
        'a11y'
      ]
    ],

    // Type validation (conventional commits)
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation
        'style',    // Formatting, missing semicolons, etc
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf',     // Performance improvement
        'test',     // Adding or modifying tests
        'chore',    // Maintenance tasks
        'ci',       // Changes to CI configuration
        'build',    // Changes to build system or dependencies
        'revert',   // Revert a previous commit
        'wip',      // Work in progress
        'breaking'  // Breaking change
      ]
    ]
  },

  // Configure interactive prompts for commitizen
  prompt: {
    questions: {
      type: {
        description: "Select the type of change that you're committing",
        enum: {
          feat: {
            description: '🎉 A new feature',
            title: 'Features',
            emoji: '🎉',
          },
          fix: {
            description: '🐛 A bug fix',
            title: 'Bug Fixes',
            emoji: '🐛',
          },
          docs: {
            description: '📚 Documentation only changes',
            title: 'Documentation',
            emoji: '📚',
          },
          style: {
            description: '🎨 Changes that do not affect the meaning of the code',
            title: 'Styles',
            emoji: '🎨',
          },
          refactor: {
            description: '♻️  A code change that neither fixes a bug nor adds a feature',
            title: 'Code Refactoring',
            emoji: '♻️',
          },
          perf: {
            description: '⚡️ A code change that improves performance',
            title: 'Performance Improvements',
            emoji: '⚡️',
          },
          test: {
            description: '✅ Adding missing tests or correcting existing tests',
            title: 'Tests',
            emoji: '✅',
          },
          build: {
            description: '🛠️ Changes that affect the build system or external dependencies',
            title: 'Builds',
            emoji: '🛠️',
          },
          ci: {
            description: '🔧 Changes to our CI configuration files and scripts',
            title: 'Continuous Integrations',
            emoji: '🔧',
          },
          chore: {
            description: '🧹 Other changes that don\'t modify src or test files',
            title: 'Chores',
            emoji: '🧹',
          },
          revert: {
            description: '⏪️ Reverts a previous commit',
            title: 'Reverts',
            emoji: '⏪️',
          },
        },
      },
      scope: {
        description: 'What is the scope of this change (e.g. component or file name)',
        enum: [
          'backend',
          'mobile',
          'shared',
          'auth',
          'api',
          'ui',
          'navigation',
          'database',
          'config',
          'build',
          'ci',
          'docs',
          'deps',
          'release',
          'lint',
          'format',
          'test',
          'perf',
          'security',
          'a11y'
        ]
      },
      subject: {
        description: 'Write a short, imperative tense description of the change',
      },
      body: {
        description: 'Provide a longer description of the change',
      },
      isBreaking: {
        description: 'Are there any breaking changes?',
        default: false,
      },
      breakingBody: {
        description: 'A BREAKING CHANGE commit requires a body. Please enter a longer description of the commit itself',
      },
      breaking: {
        description: 'Describe the breaking changes',
      },
      isIssueAffected: {
        description: 'Does this change affect any open issues?',
        default: false,
      },
      issuesBody: {
        description: 'If issues are closed, the commit requires a body. Please enter a longer description of the commit itself',
      },
      issues: {
        description: 'Add issue references (e.g. "fix #123", "re #123".)',
      },
    },
  },

  // Ignore certain commit patterns
  ignores: [
    (commit) => commit.includes('WIP'),
    (commit) => commit.includes('[skip ci]'),
    (commit) => commit.includes('Merge branch'),
    (commit) => commit.includes('Merge pull request')
  ]
};
