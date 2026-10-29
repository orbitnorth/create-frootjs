/**
 * Testing Framework Add-on for create-frootjs
 * Injects Vitest or Node:test suite into generated Froot projects.
 */

export type TestingOption = 'none' | 'vitest' | 'node';

export interface TestingAddonOptions {
  projectName: string;
}

interface PackageJsonLike {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

export function applyTestingAddon(
  files: Record<string, string>,
  testing: TestingOption,
  options: TestingAddonOptions
): void {
  if (testing === 'none') return;

  const pkgJsonStr = files['package.json'];
  if (!pkgJsonStr) return;

  const pkg: PackageJsonLike = JSON.parse(pkgJsonStr);
  pkg.scripts = pkg.scripts || {};
  pkg.devDependencies = pkg.devDependencies || {};

  // Resolve where app is exported
  let appImport = '../src/index.js';
  if (files['src/app.ts']) {
    appImport = '../src/app.js';
  } else if (files['src/server.ts']) {
    appImport = '../src/server.js';
  }

  if (testing === 'vitest') {
    pkg.devDependencies['vitest'] = '^3.0.0';
    pkg.scripts['test'] = 'vitest run';
    pkg.scripts['test:watch'] = 'vitest';

    files['vitest.config.ts'] = `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
});
`;

    files['tests/app.test.ts'] = `import { describe, it, expect } from 'vitest';
import { app } from '${appImport}';

describe('${options.projectName} HTTP tests', () => {
  it('responds with status 200 on GET /', async () => {
    const res = await app.fetch(new Request('http://localhost/'));
    expect(res.status).toBe(200);
  });
});
`;
  } else if (testing === 'node') {
    pkg.scripts['test'] = 'node --test tests/*.test.ts';

    files['tests/app.test.ts'] = `import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '${appImport}';

describe('${options.projectName} HTTP tests', () => {
  it('responds with status 200 on GET /', async () => {
    const res = await app.fetch(new Request('http://localhost/'));
    assert.equal(res.status, 200);
  });
});
`;
  }

  files['package.json'] = JSON.stringify(pkg, null, 2) + '\n';
}
