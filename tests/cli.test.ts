import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { TEMPLATES, TEMPLATE_LIST, getTemplate } from '../dist/templates/index.js';
import { scaffoldProject } from '../dist/generator.js';

describe('create-frootjs Templates & Scaffolder', () => {
  let tempBaseDir: string;

  before(async () => {
    tempBaseDir = await fs.mkdtemp(path.join(os.tmpdir(), 'froot-cli-test-'));
  });

  after(async () => {
    try {
      await fs.rm(tempBaseDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors on windows file locks
    }
  });

  it('provides all 7 required architectural templates', () => {
    const expectedTemplates = [
      'mvc',
      'modular',
      'streaming',
      'websocket',
      'openapi',
      'fullstack',
      'minimal',
    ];

    assert.equal(TEMPLATE_LIST.length, 7);
    for (const id of expectedTemplates) {
      const t = getTemplate(id);
      assert.ok(t, `Template ${id} must be registered`);
      assert.equal(t.id, id);
      assert.ok(t.name.length > 0);
      assert.ok(t.description.length > 0);
    }
  });

  it('ensures each template generates package.json depending on frootjs', () => {
    for (const t of TEMPLATE_LIST) {
      const files = t.generate('test-project');

      assert.ok(files['package.json'], `Template ${t.id} must generate package.json`);
      assert.ok(files['tsconfig.json'], `Template ${t.id} must generate tsconfig.json`);
      assert.ok(files['README.md'], `Template ${t.id} must generate README.md`);
      assert.ok(files['.gitignore'], `Template ${t.id} must generate .gitignore`);

      const pkg = JSON.parse(files['package.json']!);
      assert.equal(pkg.name, 'test-project');
      assert.ok(
        pkg.dependencies?.frootjs,
        `Template ${t.id} must declare frootjs as dependency`
      );
      assert.equal(pkg.dependencies.frootjs, '^1.0.2');
    }
  });

  it('scaffolds mvc template onto disk', async () => {
    const targetDir = path.join(tempBaseDir, 'test-mvc');
    const template = getTemplate('mvc')!;

    const result = await scaffoldProject({
      targetDir,
      projectName: 'test-mvc',
      template,
      pkgManager: 'pnpm',
      gitInit: false,
      installDeps: false,
    });

    assert.equal(result.targetDir, targetDir);
    assert.ok(result.filesWritten >= 9);

    const hasApp = await fs.stat(path.join(targetDir, 'src/app.ts'));
    assert.ok(hasApp.isFile());

    const hasController = await fs.stat(path.join(targetDir, 'src/controllers/user.controller.ts'));
    assert.ok(hasController.isFile());
  });

  it('scaffolds modular template onto disk', async () => {
    const targetDir = path.join(tempBaseDir, 'test-modular');
    const template = getTemplate('modular')!;

    const result = await scaffoldProject({
      targetDir,
      projectName: 'test-modular',
      template,
      pkgManager: 'npm',
      gitInit: false,
      installDeps: false,
    });

    assert.ok(result.filesWritten >= 10);
    const hasGuard = await fs.stat(path.join(targetDir, 'src/common/guards/auth.guard.ts'));
    assert.ok(hasGuard.isFile());
  });

  it('scaffolds streaming template onto disk', async () => {
    const targetDir = path.join(tempBaseDir, 'test-streaming');
    const template = getTemplate('streaming')!;

    const result = await scaffoldProject({
      targetDir,
      projectName: 'test-streaming',
      template,
      pkgManager: 'pnpm',
      gitInit: false,
      installDeps: false,
    });

    assert.ok(result.filesWritten >= 4);
    const serverFile = await fs.readFile(path.join(targetDir, 'src/server.ts'), 'utf8');
    assert.ok(serverFile.includes('streamSSE'));
    assert.ok(serverFile.includes('streamText'));
  });

  it('scaffolds websocket template onto disk', async () => {
    const targetDir = path.join(tempBaseDir, 'test-websocket');
    const template = getTemplate('websocket')!;

    const result = await scaffoldProject({
      targetDir,
      projectName: 'test-websocket',
      template,
      pkgManager: 'pnpm',
      gitInit: false,
      installDeps: false,
    });

    const serverFile = await fs.readFile(path.join(targetDir, 'src/server.ts'), 'utf8');
    assert.ok(serverFile.includes('upgradeWebSocket'));
    assert.ok(serverFile.includes('createHub'));
  });

  it('scaffolds openapi template onto disk', async () => {
    const targetDir = path.join(tempBaseDir, 'test-openapi');
    const template = getTemplate('openapi')!;

    const result = await scaffoldProject({
      targetDir,
      projectName: 'test-openapi',
      template,
      pkgManager: 'pnpm',
      gitInit: false,
      installDeps: false,
    });

    const serverFile = await fs.readFile(path.join(targetDir, 'src/server.ts'), 'utf8');
    assert.ok(serverFile.includes('app.openapi'));
  });

  it('scaffolds fullstack JSX template onto disk', async () => {
    const targetDir = path.join(tempBaseDir, 'test-fullstack');
    const template = getTemplate('fullstack')!;

    const result = await scaffoldProject({
      targetDir,
      projectName: 'test-fullstack',
      template,
      pkgManager: 'pnpm',
      gitInit: false,
      installDeps: false,
    });

    const layout = await fs.stat(path.join(targetDir, 'src/components/Layout.tsx'));
    assert.ok(layout.isFile());
  });

  it('scaffolds minimal template onto disk', async () => {
    const targetDir = path.join(tempBaseDir, 'test-minimal');
    const template = getTemplate('minimal')!;

    const result = await scaffoldProject({
      targetDir,
      projectName: 'test-minimal',
      template,
      pkgManager: 'pnpm',
      gitInit: false,
      installDeps: false,
    });

    const indexFile = await fs.stat(path.join(targetDir, 'src/index.ts'));
    assert.ok(indexFile.isFile());
  });

  it('compiles scaffolded modular template with typescript without errors', async () => {
    const targetDir = path.join(tempBaseDir, 'test-modular');
    // Link node_modules from create-frootjs so tsc can resolve @types/node
    const localNodeModules = path.resolve('node_modules');
    try {
      await fs.symlink(localNodeModules, path.join(targetDir, 'node_modules'), 'junction');
    } catch {
      // junction may already exist
    }

    const { exec } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const execAsync = promisify(exec);

    // Run tsc --noEmit
    const tscBin = path.join(localNodeModules, 'typescript/bin/tsc');
    const { stderr } = await execAsync(`node "${tscBin}" --noEmit`, { cwd: targetDir });
    assert.equal(stderr, '');
  });

  it('compiles scaffolded mvc template with typescript without errors', async () => {
    const targetDir = path.join(tempBaseDir, 'test-mvc');
    const localNodeModules = path.resolve('node_modules');
    try {
      await fs.symlink(localNodeModules, path.join(targetDir, 'node_modules'), 'junction');
    } catch {
      // ignore
    }

    const { exec } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const execAsync = promisify(exec);

    const tscBin = path.join(localNodeModules, 'typescript/bin/tsc');
    const { stderr } = await execAsync(`node "${tscBin}" --noEmit`, { cwd: targetDir });
    assert.equal(stderr, '');
  });

  it('scaffolds project with Drizzle ORM add-on', async () => {
    const targetDir = path.join(tempBaseDir, 'test-drizzle');
    const template = getTemplate('minimal')!;

    const result = await scaffoldProject({
      targetDir,
      projectName: 'test-drizzle',
      template,
      pkgManager: 'pnpm',
      gitInit: false,
      installDeps: false,
      database: 'drizzle',
    });

    assert.ok(result.filesWritten >= 7);
    const hasConfig = await fs.stat(path.join(targetDir, 'drizzle.config.ts'));
    assert.ok(hasConfig.isFile());
    const hasSchema = await fs.stat(path.join(targetDir, 'src/db/schema.ts'));
    assert.ok(hasSchema.isFile());

    const pkg = JSON.parse(await fs.readFile(path.join(targetDir, 'package.json'), 'utf8'));
    assert.ok(pkg.dependencies['drizzle-orm']);
    assert.ok(pkg.dependencies['better-sqlite3']);
    assert.ok(pkg.scripts['db:push']);
  });

  it('scaffolds project with Prisma add-on', async () => {
    const targetDir = path.join(tempBaseDir, 'test-prisma');
    const template = getTemplate('minimal')!;

    const result = await scaffoldProject({
      targetDir,
      projectName: 'test-prisma',
      template,
      pkgManager: 'pnpm',
      gitInit: false,
      installDeps: false,
      database: 'prisma',
    });

    assert.ok(result.filesWritten >= 7);
    const hasSchema = await fs.stat(path.join(targetDir, 'prisma/schema.prisma'));
    assert.ok(hasSchema.isFile());

    const pkg = JSON.parse(await fs.readFile(path.join(targetDir, 'package.json'), 'utf8'));
    assert.ok(pkg.dependencies['@prisma/client']);
    assert.ok(pkg.devDependencies['prisma']);
    assert.ok(pkg.scripts['db:push']);
  });

  it('scaffolds project with Docker add-on', async () => {
    const targetDir = path.join(tempBaseDir, 'test-docker');
    const template = getTemplate('minimal')!;

    const result = await scaffoldProject({
      targetDir,
      projectName: 'test-docker',
      template,
      pkgManager: 'pnpm',
      gitInit: false,
      installDeps: false,
      docker: true,
    });

    assert.ok(result.filesWritten >= 8);
    const hasDockerfile = await fs.stat(path.join(targetDir, 'Dockerfile'));
    assert.ok(hasDockerfile.isFile());
    const hasCompose = await fs.stat(path.join(targetDir, 'docker-compose.yml'));
    assert.ok(hasCompose.isFile());
    const hasDockerignore = await fs.stat(path.join(targetDir, '.dockerignore'));
    assert.ok(hasDockerignore.isFile());

    const dockerfile = await fs.readFile(path.join(targetDir, 'Dockerfile'), 'utf8');
    assert.ok(dockerfile.includes('FROM node:22-alpine'));
    assert.ok(dockerfile.includes('dist/index.js'));
  });

  it('scaffolds project with Biome linter add-on', async () => {
    const targetDir = path.join(tempBaseDir, 'test-biome');
    const template = getTemplate('minimal')!;

    const result = await scaffoldProject({
      targetDir,
      projectName: 'test-biome',
      template,
      pkgManager: 'pnpm',
      gitInit: false,
      installDeps: false,
      linter: 'biome',
    });

    assert.ok(result.filesWritten >= 6);
    const hasBiomeJson = await fs.stat(path.join(targetDir, 'biome.json'));
    assert.ok(hasBiomeJson.isFile());

    const pkg = JSON.parse(await fs.readFile(path.join(targetDir, 'package.json'), 'utf8'));
    assert.ok(pkg.devDependencies['@biomejs/biome']);
    assert.equal(pkg.scripts['lint'], 'biome lint src/');
    assert.equal(pkg.scripts['format'], 'biome format --write src/');
    assert.equal(pkg.scripts['check'], 'biome check src/');
  });

  it('scaffolds project with ESLint + Prettier add-on', async () => {
    const targetDir = path.join(tempBaseDir, 'test-eslint');
    const template = getTemplate('minimal')!;

    const result = await scaffoldProject({
      targetDir,
      projectName: 'test-eslint',
      template,
      pkgManager: 'pnpm',
      gitInit: false,
      installDeps: false,
      linter: 'eslint',
    });

    assert.ok(result.filesWritten >= 7);
    const hasEslint = await fs.stat(path.join(targetDir, 'eslint.config.js'));
    assert.ok(hasEslint.isFile());
    const hasPrettier = await fs.stat(path.join(targetDir, '.prettierrc'));
    assert.ok(hasPrettier.isFile());

    const pkg = JSON.parse(await fs.readFile(path.join(targetDir, 'package.json'), 'utf8'));
    assert.ok(pkg.devDependencies['eslint']);
    assert.ok(pkg.devDependencies['prettier']);
    assert.ok(pkg.devDependencies['@eslint/js']);
    assert.ok(pkg.devDependencies['typescript-eslint']);
    assert.equal(pkg.scripts['lint'], 'eslint src/');
    assert.equal(pkg.scripts['format'], 'prettier --write src/');
  });

  it('scaffolds project with Vitest testing add-on', async () => {
    const targetDir = path.join(tempBaseDir, 'test-vitest');
    const template = getTemplate('minimal')!;

    const result = await scaffoldProject({
      targetDir,
      projectName: 'test-vitest',
      template,
      pkgManager: 'pnpm',
      gitInit: false,
      installDeps: false,
      testing: 'vitest',
    });

    assert.ok(result.filesWritten >= 7);
    const hasConfig = await fs.stat(path.join(targetDir, 'vitest.config.ts'));
    assert.ok(hasConfig.isFile());
    const hasTestFile = await fs.stat(path.join(targetDir, 'tests/app.test.ts'));
    assert.ok(hasTestFile.isFile());

    const testContent = await fs.readFile(path.join(targetDir, 'tests/app.test.ts'), 'utf8');
    assert.ok(testContent.includes("from 'vitest'"));
    assert.ok(testContent.includes('app.fetch'));

    const pkg = JSON.parse(await fs.readFile(path.join(targetDir, 'package.json'), 'utf8'));
    assert.ok(pkg.devDependencies['vitest']);
    assert.equal(pkg.scripts['test'], 'vitest run');
  });

  it('scaffolds project with Node:test testing add-on', async () => {
    const targetDir = path.join(tempBaseDir, 'test-nodetest');
    const template = getTemplate('mvc')!;

    const result = await scaffoldProject({
      targetDir,
      projectName: 'test-nodetest',
      template,
      pkgManager: 'pnpm',
      gitInit: false,
      installDeps: false,
      testing: 'node',
    });

    assert.ok(result.filesWritten >= 10);
    const hasTestFile = await fs.stat(path.join(targetDir, 'tests/app.test.ts'));
    assert.ok(hasTestFile.isFile());

    const testContent = await fs.readFile(path.join(targetDir, 'tests/app.test.ts'), 'utf8');
    assert.ok(testContent.includes("from 'node:test'"));
    assert.ok(testContent.includes('app.fetch'));

    const pkg = JSON.parse(await fs.readFile(path.join(targetDir, 'package.json'), 'utf8'));
    assert.equal(pkg.scripts['test'], 'node --test tests/*.test.ts');
  });

  it('scaffolds project with AGENT.md and .cursorrules by default', async () => {
    const targetDir = path.join(tempBaseDir, 'test-agent-default');
    const template = getTemplate('mvc')!;

    const result = await scaffoldProject({
      targetDir,
      projectName: 'test-agent-default',
      template,
      pkgManager: 'pnpm',
      gitInit: false,
      installDeps: false,
      database: 'drizzle',
      testing: 'vitest',
    });

    const hasAgent = await fs.stat(path.join(targetDir, 'AGENT.md'));
    assert.ok(hasAgent.isFile());
    const hasCursorRules = await fs.stat(path.join(targetDir, '.cursorrules'));
    assert.ok(hasCursorRules.isFile());

    const agentContent = await fs.readFile(path.join(targetDir, 'AGENT.md'), 'utf8');
    assert.ok(agentContent.includes('# AI Agent Guide: test-agent-default'));
    assert.ok(agentContent.includes('Database: Drizzle ORM + SQLite'));
    assert.ok(agentContent.includes('Testing: Vitest'));
    assert.ok(agentContent.includes('Anti-Patterns to AVOID'));
    assert.ok(agentContent.includes('app.fetch(request)'));

    const cursorContent = await fs.readFile(path.join(targetDir, '.cursorrules'), 'utf8');
    assert.ok(cursorContent.includes('Froot Framework Rules'));
  });

  it('allows disabling agent files via agentRules: false', async () => {
    const targetDir = path.join(tempBaseDir, 'test-no-agent');
    const template = getTemplate('minimal')!;

    await scaffoldProject({
      targetDir,
      projectName: 'test-no-agent',
      template,
      pkgManager: 'pnpm',
      gitInit: false,
      installDeps: false,
      agentRules: false,
    });

    let agentExists = false;
    try {
      await fs.stat(path.join(targetDir, 'AGENT.md'));
      agentExists = true;
    } catch {
      agentExists = false;
    }
    assert.equal(agentExists, false);
  });

  it('outputs valid JSON schema when called with --schema', async () => {
    const { exec } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const execAsync = promisify(exec);

    const { stdout } = await execAsync('node dist/index.js --schema', { cwd: path.resolve() });
    const schema = JSON.parse(stdout);

    assert.equal(schema.name, 'create-frootjs');
    assert.ok(Array.isArray(schema.templates));
    assert.equal(schema.templates.length, 7);
    assert.ok(schema.options.template);
    assert.ok(schema.options.database);
    assert.ok(schema.recipes.enterpriseApi);
  });
});
