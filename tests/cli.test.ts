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
      assert.equal(pkg.dependencies.frootjs, '^1.0.1');
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
});
