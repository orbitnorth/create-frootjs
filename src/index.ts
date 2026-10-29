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

const VERSION = '1.0.2';

interface ParsedArgs {
  targetDir?: string;
  template?: string;
  pkgManager?: 'pnpm' | 'npm' | 'yarn' | 'bun';
  git?: boolean;
  install?: boolean;
  yes?: boolean;
  help?: boolean;
  version?: boolean;
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
    } else if (item === '--template' || item === '-t') {
      args.template = raw[++i];
    } else if (item.startsWith('--template=')) {
      args.template = item.split('=')[1];
    } else if (item === '--pm') {
      args.pkgManager = raw[++i] as ParsedArgs['pkgManager'];
    } else if (item.startsWith('--pm=')) {
      args.pkgManager = item.split('=')[1] as ParsedArgs['pkgManager'];
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
                             • mvc          MVC / Layered Architecture
                             • modular      Modular Architecture (NestJS-style)
                             • streaming    Real-Time Streaming & SSE
                             • websocket    WebSocket & Real-Time Pub/Sub
                             • openapi      OpenAPI 3.1 & Interactive Docs
                             • fullstack    Fullstack JSX & SSR
                             • minimal      Minimal Starter (Single-file)
    --pm <manager>           Package manager: pnpm | npm | yarn | bun
    --git / --no-git         Initialize a git repository
    --install / --no-install Automatically install dependencies
    -y, --yes                Accept all defaults non-interactively
    -v, --version            Display version
    -h, --help               Display help information
`);
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
      printStep(1, 4, 'Project location');
      targetDir = await promptText('Where would you like to create your project?', 'my-froot-app', (input) => {
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
      printStep(1, 4, 'Target directory warning');
      const proceed = await promptConfirm(
        `Target directory "${targetDir}" is not empty. Continue anyway?`,
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
      printStep(2, 4, 'Choose architectural template');
      const choice = await promptSelect(
        'Select the project template that fits your architecture:',
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

  // 3. Package Manager Selection
  const detectedPm = detectCurrentPackageManager();
  let pkgManager = args.pkgManager || detectedPm;

  if (!args.pkgManager && !args.yes) {
    printStep(3, 4, 'Package manager');
    pkgManager = await promptSelect<'pnpm' | 'npm' | 'yarn' | 'bun'>(
      'Which package manager do you want to use?',
      [
        { value: 'pnpm', label: 'pnpm', hint: 'Fast, disk space efficient' },
        { value: 'npm', label: 'npm', hint: 'Standard Node package manager' },
        { value: 'yarn', label: 'yarn', hint: 'Classic or Modern Yarn' },
        { value: 'bun', label: 'bun', hint: 'Ultra-fast all-in-one toolkit' },
      ]
    );
    console.log();
  }

  // 4. Git Initialization & Install Preferences
  let gitInit = args.git;
  let installDeps = args.install;

  if (!args.yes) {
    printStep(4, 4, 'Project setup preferences');
    if (gitInit === undefined) {
      gitInit = await promptConfirm('Initialize a new git repository?', true);
    }
    if (installDeps === undefined) {
      installDeps = await promptConfirm(`Install dependencies now with ${pkgManager}?`, true);
    }
    console.log();
  } else {
    if (gitInit === undefined) gitInit = true;
    if (installDeps === undefined) installDeps = true;
  }

  // 5. Scaffold Project
  try {
    const result = await scaffoldProject({
      targetDir: resolvedTarget,
      projectName,
      template: selectedTemplate,
      pkgManager,
      gitInit: Boolean(gitInit),
      installDeps: Boolean(installDeps),
    });

    // 6. Print stylized next steps card
    printNextSteps({
      projectDir: targetDir,
      pkgManager,
      hasInstalled: result.depsInstalled,
      port: 3000,
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
