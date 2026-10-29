#!/usr/bin/env node

/**
 * create-frootjs CLI Project Generator
 * Interactive, zero-dependency CLI tool for scaffolding modern Froot web applications.
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import {
  printBanner,
  printStep,
  printError,
  printNextSteps,
  promptText,
  promptSelect,
  promptConfirm,
  c,
} from './ui.js';
import { TEMPLATES, TEMPLATE_LIST, getTemplate } from './templates/index.js';
import { scaffoldProject } from './generator.js';

const VERSION = '1.0.8';

interface ParsedArgs {
  targetDir?: string;
  template?: string;
  pkgManager?: 'pnpm' | 'npm' | 'yarn' | 'bun';
  db?: 'none' | 'drizzle' | 'prisma';
  docker?: boolean;
  linter?: 'none' | 'biome' | 'eslint';
  testing?: 'none' | 'vitest' | 'node';
  agent?: boolean;
  git?: boolean;
  install?: boolean;
  yes?: boolean;
  help?: boolean;
  version?: boolean;
  schema?: boolean;
}

function parseCliArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {};
  const raw = argv.slice(2);

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i]!;

    if (item === '--help' || item === '-h') {
      args.help = true;
    } else if (item === '--version' || item === '-v') {
      args.version = true;
    } else if (item === '--schema' || item === '--json-schema' || item === 'schema') {
      args.schema = true;
    } else if (item === '--yes' || item === '-y') {
      args.yes = true;
    } else if (item === '--git') {
      args.git = true;
    } else if (item === '--no-git') {
      args.git = false;
    } else if (item === '--install') {
      args.install = true;
    } else if (item === '--no-install') {
      args.install = false;
    } else if (item === '--docker') {
      args.docker = true;
    } else if (item === '--no-docker') {
      args.docker = false;
    } else if (item === '--agent' || item === '--ai') {
      args.agent = true;
    } else if (item === '--no-agent' || item === '--no-ai') {
      args.agent = false;
    } else if (item === '--biome') {
      args.linter = 'biome';
    } else if (item === '--eslint') {
      args.linter = 'eslint';
    } else if (item === '--linter') {
      args.linter = raw[++i] as ParsedArgs['linter'];
    } else if (item.startsWith('--linter=')) {
      args.linter = item.split('=')[1] as ParsedArgs['linter'];
    } else if (item === '--vitest') {
      args.testing = 'vitest';
    } else if (item === '--test' || item === '--testing') {
      args.testing = raw[++i] as ParsedArgs['testing'];
    } else if (item.startsWith('--testing=') || item.startsWith('--test=')) {
      args.testing = item.split('=')[1] as ParsedArgs['testing'];
    } else if (item === '--template' || item === '-t') {
      args.template = raw[++i];
    } else if (item.startsWith('--template=')) {
      args.template = item.split('=')[1];
    } else if (item === '--pm') {
      args.pkgManager = raw[++i] as ParsedArgs['pkgManager'];
    } else if (item.startsWith('--pm=')) {
      args.pkgManager = item.split('=')[1] as ParsedArgs['pkgManager'];
    } else if (item === '--db' || item === '--database') {
      args.db = raw[++i] as ParsedArgs['db'];
    } else if (item.startsWith('--db=')) {
      args.db = item.split('=')[1] as ParsedArgs['db'];
    } else if (!item.startsWith('-') && !args.targetDir) {
      args.targetDir = item;
    }
  }

  return args;
}

function printUsage(): void {
  console.log(`
  ${c.bold}Usage:${c.reset}
    npm create frootjs [project-directory] [options]
    npx create-frootjs [project-directory] [options]

  ${c.bold}Options:${c.reset}
    -t, --template <name>    Template architecture:
                             • mvc          Controllers, services, models
                             • modular      NestJS-style feature modules
                             • streaming    SSE & token streaming
                             • websocket    Real-time pub/sub rooms
                             • openapi      REST API & Scalar docs
                             • fullstack    Server-rendered JSX views
                             • minimal      Lean single-file starter
    --pm <manager>           Package manager: pnpm | npm | yarn | bun
    --db <orm>               Database ORM: none | drizzle | prisma
    --linter <tool>          Linter & formatter: none | biome | eslint
    --test <tool>            Testing framework: none | vitest | node
    --agent / --no-agent     Generate AGENT.md & .cursorrules for AI assistants
    --schema                 Output machine-readable JSON schema for AI agents
    --docker / --no-docker   Generate Docker setup
    --git / --no-git         Initialize a git repository
    --install / --no-install Automatically install dependencies
    -y, --yes                Accept all defaults non-interactively
    -v, --version            Display version
    -h, --help               Display help information
`);
}

function printAgentSchema(): void {
  const schema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    name: 'create-frootjs',
    version: VERSION,
    description: 'CLI generator for scaffolding high-performance Froot TypeScript web applications',
    usage: 'npm create frootjs [project-directory] [options]',
    nonInteractiveFlag: '-y or --yes',
    templates: TEMPLATE_LIST.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
    })),
    options: {
      template: {
        flag: '-t, --template <name>',
        choices: ['mvc', 'modular', 'streaming', 'websocket', 'openapi', 'fullstack', 'minimal'],
        default: 'mvc',
        description: 'Architectural pattern of the scaffolded application',
      },
      database: {
        flag: '--db <orm>',
        choices: ['none', 'drizzle', 'prisma'],
        default: 'none',
        description: 'Database ORM integration',
      },
      docker: {
        flag: '--docker / --no-docker',
        type: 'boolean',
        default: false,
        description: 'Generate multi-stage Dockerfile and docker-compose.yml',
      },
      linter: {
        flag: '--linter <tool>',
        choices: ['none', 'biome', 'eslint'],
        default: 'none',
        description: 'Code quality and linting tool',
      },
      testing: {
        flag: '--test <framework>',
        choices: ['none', 'vitest', 'node'],
        default: 'none',
        description: 'Unit testing suite',
      },
      agentRules: {
        flag: '--agent / --no-agent',
        type: 'boolean',
        default: true,
        description: 'Generate AGENT.md and .cursorrules for AI agents and coding assistants',
      },
      packageManager: {
        flag: '--pm <manager>',
        choices: ['pnpm', 'npm', 'yarn', 'bun'],
        default: 'auto-detected',
        description: 'Package manager for dependency installation',
      },
    },
    recipes: {
      enterpriseApi: 'npm create frootjs my-app -t modular --db drizzle --docker --linter biome --test vitest -y',
      mvcCrudApp: 'npm create frootjs my-app -t mvc --db drizzle --linter biome --test vitest -y',
      restApiScalarDocs: 'npm create frootjs my-app -t openapi --db prisma --linter eslint --test node -y',
      realtimeWebSocket: 'npm create frootjs my-app -t websocket --linter biome --test vitest -y',
      aiStreamingSSE: 'npm create frootjs my-app -t streaming --linter biome --test vitest -y',
      fullstackJsx: 'npm create frootjs my-app -t fullstack --linter biome --test vitest -y',
      minimalStarter: 'npm create frootjs my-app -t minimal --docker --test vitest -y',
    },
  };

  console.log(JSON.stringify(schema, null, 2));
}

/** Detect which package manager invoked create-frootjs */
function detectCurrentPackageManager(): 'pnpm' | 'npm' | 'yarn' | 'bun' {
  const userAgent = process.env.npm_config_user_agent || '';
  if (userAgent.startsWith('pnpm')) return 'pnpm';
  if (userAgent.startsWith('yarn')) return 'yarn';
  if (userAgent.startsWith('bun')) return 'bun';
  return 'npm';
}

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv);

  if (args.schema) {
    printAgentSchema();
    return;
  }

  if (args.version) {
    console.log(`create-frootjs v${VERSION}`);
    return;
  }

  if (args.help) {
    printBanner(VERSION);
    printUsage();
    return;
  }

  printBanner(VERSION);

  // 1. Resolve Project Directory & Name
  let targetDir = args.targetDir;
  if (!targetDir) {
    if (args.yes) {
      targetDir = 'froot-app';
    } else {
      printStep(1, 7, 'Directory');
      targetDir = await promptText('Project directory:', 'my-froot-app', (input) => {
        if (!input.trim()) return 'Project name cannot be empty';
        return true;
      });
      console.log();
    }
  }

  const resolvedTarget = path.resolve(process.cwd(), targetDir);
  const projectName = path.basename(resolvedTarget);

  // Verify if directory already exists with files
  if (fs.existsSync(resolvedTarget)) {
    const existingFiles = fs.readdirSync(resolvedTarget);
    if (existingFiles.length > 0 && !args.yes) {
      printStep(1, 7, 'Directory warning');
      const proceed = await promptConfirm(
        `Directory "${targetDir}" is not empty. Continue?`,
        false
      );
      console.log();
      if (!proceed) {
        printError('Aborted by user.');
        process.exit(1);
      }
    }
  }

  // 2. Select Template
  let selectedTemplate = args.template ? getTemplate(args.template) : undefined;

  if (args.template && !selectedTemplate) {
    printError(`Unknown template "${args.template}".`);
    console.log(`Available templates: ${Object.keys(TEMPLATES).join(', ')}`);
    process.exit(1);
  }

  if (!selectedTemplate) {
    if (args.yes) {
      selectedTemplate = TEMPLATES['mvc']!;
    } else {
      printStep(2, 7, 'Template');
      const choice = await promptSelect(
        'Select a template:',
        TEMPLATE_LIST.map((t) => ({
          value: t.id,
          label: t.name,
          hint: t.description,
        }))
      );
      selectedTemplate = getTemplate(choice)!;
      console.log();
    }
  }

  // 3. Database ORM Selection
  let dbOption = args.db || 'none';
  if (!args.db && !args.yes) {
    printStep(3, 7, 'Database');
    dbOption = await promptSelect<'none' | 'drizzle' | 'prisma'>(
      'Include database ORM?',
      [
        { value: 'none', label: 'None', hint: 'In-memory / no database' },
        { value: 'drizzle', label: 'Drizzle', hint: 'Drizzle ORM & SQLite' },
        { value: 'prisma', label: 'Prisma', hint: 'Prisma & SQLite starter' },
      ]
    );
    console.log();
  }

  // 4. Linter & Formatter Selection
  let linterOption = args.linter || 'none';
  if (!args.linter && !args.yes) {
    printStep(4, 7, 'Linter & Formatter');
    linterOption = await promptSelect<'none' | 'biome' | 'eslint'>(
      'Code quality tooling:',
      [
        { value: 'none', label: 'None', hint: 'No linter config' },
        { value: 'biome', label: 'Biome', hint: 'Fast Rust linter & formatter' },
        { value: 'eslint', label: 'ESLint', hint: 'ESLint 9 & Prettier' },
      ]
    );
    console.log();
  }

  // 5. Testing Framework Selection
  let testingOption = args.testing || 'none';
  if (!args.testing && !args.yes) {
    printStep(5, 7, 'Testing');
    testingOption = await promptSelect<'none' | 'vitest' | 'node'>(
      'Testing framework:',
      [
        { value: 'vitest', label: 'Vitest', hint: 'Fast modern unit test runner' },
        { value: 'node', label: 'Node:test', hint: 'Native Node.js test runner' },
        { value: 'none', label: 'None', hint: 'No testing setup' },
      ]
    );
    console.log();
  }

  // 6. Package Manager Selection
  const detectedPm = detectCurrentPackageManager();
  let pkgManager = args.pkgManager || detectedPm;

  if (!args.pkgManager && !args.yes) {
    printStep(6, 7, 'Package manager');
    pkgManager = await promptSelect<'pnpm' | 'npm' | 'yarn' | 'bun'>(
      'Select package manager:',
      [
        { value: 'pnpm', label: 'pnpm', hint: 'Fast, disk-efficient' },
        { value: 'npm', label: 'npm', hint: 'Standard' },
        { value: 'yarn', label: 'yarn', hint: 'Classic / Modern' },
        { value: 'bun', label: 'bun', hint: 'All-in-one toolkit' },
      ]
    );
    console.log();
  }

  // 7. Git, Docker & Install Preferences
  let gitInit = args.git;
  let docker = args.docker;
  let installDeps = args.install;

  if (!args.yes) {
    printStep(7, 7, 'Preferences');
    if (gitInit === undefined) {
      gitInit = await promptConfirm('Initialize git repository?', true);
    }
    if (docker === undefined) {
      docker = await promptConfirm('Include Docker container setup?', false);
    }
    if (installDeps === undefined) {
      installDeps = await promptConfirm(`Install dependencies with ${pkgManager}?`, true);
    }
    console.log();
  } else {
    if (gitInit === undefined) gitInit = true;
    if (docker === undefined) docker = false;
    if (installDeps === undefined) installDeps = true;
  }

  // 8. Scaffold Project
  const startTime = performance.now();
  try {
    const result = await scaffoldProject({
      targetDir: resolvedTarget,
      projectName,
      template: selectedTemplate,
      pkgManager,
      gitInit: Boolean(gitInit),
      installDeps: Boolean(installDeps),
      database: dbOption,
      docker: Boolean(docker),
      linter: linterOption,
      testing: testingOption,
      agentRules: args.agent !== false,
    });

    const durationMs = Math.round(performance.now() - startTime);

    // 6. Print stylized next steps card
    printNextSteps({
      projectDir: targetDir,
      pkgManager,
      hasInstalled: result.depsInstalled,
      port: 3000,
      durationMs,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    printError(`Scaffolding failed: ${msg}`);
    process.exit(1);
  }
}

main().catch((err) => {
  printError(String(err));
  process.exit(1);
});
