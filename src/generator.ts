/**
 * Project Scaffolding Engine
 * Writes template files to disk, initializes git, and executes dependency installation.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { TemplateDefinition } from './templates/index.js';
import { c, printSuccess, printInfo, printWarning } from './ui.js';

const execAsync = promisify(exec);

export interface ScaffoldOptions {
  targetDir: string;
  projectName: string;
  template: TemplateDefinition;
  pkgManager: 'pnpm' | 'npm' | 'yarn' | 'bun';
  gitInit: boolean;
  installDeps: boolean;
}

export interface ScaffoldResult {
  targetDir: string;
  filesWritten: number;
  gitInitialized: boolean;
  depsInstalled: boolean;
}

export async function scaffoldProject(options: ScaffoldOptions): Promise<ScaffoldResult> {
  const { targetDir, projectName, template, pkgManager, gitInit, installDeps } = options;

  // 1. Ensure target directory exists
  await fs.mkdir(targetDir, { recursive: true });

  // 2. Generate files map from template
  const files = template.generate(projectName);
  const fileKeys = Object.keys(files);

  // 3. Write each file to destination
  for (const relativePath of fileKeys) {
    const filePath = path.join(targetDir, relativePath);
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, files[relativePath]!, 'utf8');
  }

  printSuccess(`Created ${c.bold}${fileKeys.length}${c.reset} files from template ${c.emerald}${template.name}${c.reset}`);

  // 4. Git initialization
  let gitInitialized = false;
  if (gitInit) {
    try {
      await execAsync('git init', { cwd: targetDir });
      gitInitialized = true;
      printSuccess(`Initialized git repository`);
    } catch {
      printWarning(`Could not initialize git repository (is git installed?)`);
    }
  }

  // 5. Dependency installation
  let depsInstalled = false;
  if (installDeps) {
    printInfo(`Installing dependencies using ${c.bold}${pkgManager}${c.reset}...`);
    try {
      // Use .cmd extension on Windows when running npm/pnpm/yarn
      const isWin = process.platform === 'win32';
      const cmd = isWin && pkgManager !== 'bun' ? `${pkgManager}.cmd` : pkgManager;
      await execAsync(`${cmd} install`, { cwd: targetDir });
      depsInstalled = true;
      printSuccess(`Dependencies installed successfully`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      printWarning(`Dependency installation skipped or failed: ${errMsg}`);
    }
  }

  return {
    targetDir,
    filesWritten: fileKeys.length,
    gitInitialized,
    depsInstalled,
  };
}
