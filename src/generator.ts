/**
 * Project Scaffolding Engine
 * Writes template files to disk, initializes git, and executes dependency installation with animated spinners.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { TemplateDefinition } from './templates/index.js';
import { c, Spinner, printWarning } from './ui.js';
import { DatabaseOption, applyDatabaseAddon } from './addons/database.js';
import { applyDockerAddon } from './addons/docker.js';
import { LinterOption, applyLinterAddon } from './addons/linter.js';
import { TestingOption, applyTestingAddon } from './addons/testing.js';
import { applyAgentAddon } from './addons/agent.js';

const execAsync = promisify(exec);

export interface ScaffoldOptions {
  targetDir: string;
  projectName: string;
  template: TemplateDefinition;
  pkgManager: 'pnpm' | 'npm' | 'yarn' | 'bun';
  gitInit: boolean;
  installDeps: boolean;
  database?: DatabaseOption;
  docker?: boolean;
  linter?: LinterOption;
  testing?: TestingOption;
  agentRules?: boolean;
}

export interface ScaffoldResult {
  targetDir: string;
  filesWritten: number;
  gitInitialized: boolean;
  depsInstalled: boolean;
}

export async function scaffoldProject(options: ScaffoldOptions): Promise<ScaffoldResult> {
  const {
    targetDir,
    projectName,
    template,
    pkgManager,
    gitInit,
    installDeps,
    database,
    docker,
    linter,
    testing,
    agentRules = true,
  } = options;

  // 1. Ensure target directory exists
  await fs.mkdir(targetDir, { recursive: true });

  // 2. Generate files map from template
  const writeSpinner = new Spinner(`Scaffolding ${template.name} template`).start();
  const files = template.generate(projectName);

  if (database && database !== 'none') {
    applyDatabaseAddon(files, database);
  }

  if (docker) {
    const entryPoint = template.id === 'minimal' ? 'dist/index.js' : 'dist/server.js';
    applyDockerAddon(files, { projectName, pkgManager, entryPoint });
  }

  if (linter && linter !== 'none') {
    applyLinterAddon(files, linter);
  }

  if (testing && testing !== 'none') {
    applyTestingAddon(files, testing, { projectName });
  }

  if (agentRules) {
    applyAgentAddon(files, {
      projectName,
      templateId: template.id,
      templateName: template.name,
      pkgManager,
      database,
      linter,
      testing,
      docker,
    });
  }

  const fileKeys = Object.keys(files);

  // 3. Write each file to destination
  for (const relativePath of fileKeys) {
    const filePath = path.join(targetDir, relativePath);
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, files[relativePath]!, 'utf8');
  }

  writeSpinner.stop(`Created ${c.bold}${fileKeys.length}${c.reset} files (${c.emerald}${template.name}${c.reset})`);

  // 4. Git initialization
  let gitInitialized = false;
  if (gitInit) {
    const gitSpinner = new Spinner('Initializing git repository').start();
    try {
      await execAsync('git init', { cwd: targetDir });
      gitInitialized = true;
      gitSpinner.stop('Initialized git repository');
    } catch {
      gitSpinner.fail('Could not initialize git repository');
    }
  }

  // 5. Dependency installation
  let depsInstalled = false;
  if (installDeps) {
    const depSpinner = new Spinner(`Installing dependencies with ${pkgManager}`).start();
    try {
      const isWin = process.platform === 'win32';
      const cmd = isWin && pkgManager !== 'bun' ? `${pkgManager}.cmd` : pkgManager;
      await execAsync(`${cmd} install`, { cwd: targetDir });
      depsInstalled = true;
      depSpinner.stop(`Installed dependencies with ${c.bold}${pkgManager}${c.reset}`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      depSpinner.fail(`Dependency install skipped: ${errMsg}`);
    }
  }

  return {
    targetDir,
    filesWritten: fileKeys.length,
    gitInitialized,
    depsInstalled,
  };
}
