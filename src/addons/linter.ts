/**
 * Linter & Code Formatter Add-on for create-frootjs
 * Injects Biome (Rust-based ultra-fast linter) or ESLint + Prettier into generated projects.
 */

export type LinterOption = 'none' | 'biome' | 'eslint';

interface PackageJsonLike {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

export function applyLinterAddon(
  files: Record<string, string>,
  linter: LinterOption
): void {
  if (linter === 'none') return;

  const pkgJsonStr = files['package.json'];
  if (!pkgJsonStr) return;

  const pkg: PackageJsonLike = JSON.parse(pkgJsonStr);
  pkg.scripts = pkg.scripts || {};
  pkg.devDependencies = pkg.devDependencies || {};

  if (linter === 'biome') {
    pkg.devDependencies['@biomejs/biome'] = '^1.9.4';
    pkg.scripts['lint'] = 'biome lint src/';
    pkg.scripts['format'] = 'biome format --write src/';
    pkg.scripts['check'] = 'biome check src/';

    files['biome.json'] = `{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false,
    "ignore": ["node_modules", "dist"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always"
    }
  }
}
`;
  } else if (linter === 'eslint') {
    pkg.devDependencies['eslint'] = '^9.21.0';
    pkg.devDependencies['@eslint/js'] = '^9.21.0';
    pkg.devDependencies['typescript-eslint'] = '^8.25.0';
    pkg.devDependencies['prettier'] = '^3.5.0';

    pkg.scripts['lint'] = 'eslint src/';
    pkg.scripts['format'] = 'prettier --write src/';

    files['eslint.config.js'] = `import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**'],
  }
);
`;

    files['.prettierrc'] = `{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
`;
  }

  files['package.json'] = JSON.stringify(pkg, null, 2) + '\n';
}
