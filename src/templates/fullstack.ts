/**
 * Fullstack Next.js Alternative Template
 * Powered by froot-fullstack, Froot Core, Preact, and Tailwind CSS v4.
 * Features Next.js App Router-style file-based routing, nested layouts, Preact SSR, SSG, and Markdown content.
 */

import { TemplateDefinition, TemplateFileMap, COMMON_GITIGNORE } from './types.js';

export const fullstackTemplate: TemplateDefinition = {
  id: 'fullstack',
  name: 'Fullstack (Next.js Alternative)',
  description: 'Preact SSR & Tailwind v4',
  generate: (projectName: string): TemplateFileMap => {
    return {
      'package.json': JSON.stringify(
        {
          name: projectName,
          version: '1.0.0',
          type: 'module',
          scripts: {
            'dev:css': 'tailwindcss -i src/styles.css -o dist/styles.css --watch',
            'build:css': 'tailwindcss -i src/styles.css -o dist/styles.css --minify',
            dev: 'pnpm run build:css && tsx watch src/server.tsx',
            build: 'pnpm run build:css && tsc',
            'build:static': 'pnpm run build:css && tsx src/build.ts',
            start: 'node dist/server.js',
          },
          dependencies: {
            'froot-fullstack': '^1.1.1',
            frootjs: '^1.0.6',
            preact: '^11.1.0',
            'preact-render-to-string': '^6.8.2',
          },
          devDependencies: {
            '@tailwindcss/cli': '^4.0.0',
            tailwindcss: '^4.0.0',
            '@types/node': '^22.10.0',
            tsx: '^4.19.0',
            typescript: '^5.8.0',
          },
        },
        null,
        2
      ) + '\n',

      'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2024",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2024", "DOM", "DOM.Iterable"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`,
      '.gitignore': COMMON_GITIGNORE,

      'README.md': `# ${projectName}

High-performance **Next.js alternative** powered by **Froot Framework**, **Preact**, and **Tailwind CSS v4**.

## Features

- ⚡ **Ultra-Fast Throughput**: 120,000+ req/sec powered by Froot's monomorphic V8 engine.
- ⚛️ **Native Preact SSR**: Lightweight 3kB component runtime without React baggage.
- 🎨 **Tailwind CSS v4**: Built-in real CSS-first configuration via \`@theme\` with zero CDN dependencies.
- 📂 **Next.js App Router Architecture**:
  - File-based routing automatically discovered from \`src/app\`
  - Hierarchical nested layout system (\`app/layout.tsx\` -> \`app/docs/layout.tsx\`)
  - Dynamic route dispatch with bracket parameters (\`app/docs/[slug]/page.tsx\`)
  - Distinct layouts (e.g. landing page with navbar vs documentation with left sidebar and no top navbar)
- 🚀 **Static Site Generation (SSG)**: Prerender static pages and dynamic routes with \`generateStaticParams()\`.
- 📝 **Built-in Markdown Engine**: Next.js MDX/Contentlayer alternative with zero dependencies.

## Getting Started

\`\`\`bash
# 1. Install dependencies
pnpm install

# 2. Run in development mode (builds Tailwind v4 & starts server)
pnpm run dev

# 3. Prerender static site (SSG)
pnpm run build:static

# 4. View in browser
http://localhost:3000
\`\`\`
`,

      'content/docs/overview.md': `---
title: Overview
category: Getting Started
summary: Introduction to the Froot Fullstack Next.js Alternative architecture.
---

Welcome to **Froot Fullstack**, the high-performance Next.js alternative powered by Preact, Tailwind CSS v4, and Froot.

## Design Principles

- **Monomorphic V8 Execution:** Minimal memory overhead and maximum throughput.
- **File-Based Routing:** Next.js App Router conventions with \`src/app\`, nested layouts, and bracket parameters.
- **Preact Server-Side Rendering:** Clean JSX syntax with sub-millisecond render times.
- **Tailwind CSS v4:** Lightning-fast CSS compilation via \`@tailwindcss/cli\` and native \`@theme\` variables.
- **Layout Isolation:** Dedicated layouts for different application sections (e.g. docs vs marketing).
`,

      'content/docs/quickstart.md': `---
title: Quickstart
category: Getting Started
summary: Build your first fullstack application in seconds.
---

Create routes, compose Preact components, and serve HTML with extreme performance.

## Adding Routes

Simply add a new folder or file in \`src/app/\`:

\`\`\`tsx
// src/app/about/page.tsx
export default function AboutPage() {
  return <h1 class="text-3xl font-bold">About Us</h1>;
}
\`\`\`
`,

      'src/styles.css': `@import "tailwindcss";

@theme {
  --color-froot-400: #34d399;
  --color-froot-500: #10b981;
  --color-froot-600: #059669;
}
`,

      'src/app/layout.tsx': `import type { ComponentChildren } from 'preact';

export interface RootLayoutProps {
  title?: string;
  description?: string;
  children: ComponentChildren;
}

export default function RootLayout({
  title = 'Froot Fullstack App',
  description = 'High-performance Next.js alternative powered by Froot and Preact',
  children,
}: RootLayoutProps) {
  return (
    <html lang="en" class="dark scroll-smooth">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body class="bg-slate-950 text-slate-100 font-sans min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
`,

      'src/app/page.tsx': `export const metadata = {
  title: 'Froot Fullstack — Next.js Alternative',
  description: 'Extreme performance fullstack web engine with Preact SSR and file-based routing',
};

export default function HomePage() {
  return (
    <div>
      {/* Top Navbar on Landing Page */}
      <header class="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" class="flex items-center gap-2 font-bold text-white">
            <span class="text-xl">🍏</span>
            <span>Froot<span class="text-emerald-400">.ts</span></span>
          </a>
          <nav class="flex items-center gap-6 text-sm text-slate-300">
            <a href="#features" class="hover:text-emerald-400 transition-colors">Features</a>
            <a href="/docs" class="text-emerald-400 hover:text-emerald-300 font-semibold">Docs &rarr;</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main class="max-w-5xl mx-auto px-6 py-20 text-center">
        <div class="inline-block px-3 py-1 mb-6 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          Next.js Alternative • Preact SSR • Tailwind CSS v4 • File-Based Routing
        </div>

        <h1 class="text-5xl font-extrabold tracking-tight text-white mb-6">
          High-Performance <span class="text-emerald-400">Fullstack Web Engine</span>
        </h1>

        <p class="text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Engineered for extreme throughput, Next.js-style file-based routing, nested layouts, and zero-allocation V8 execution.
        </p>

        <div class="flex items-center justify-center gap-4">
          <a
            href="/docs"
            class="px-6 py-3 rounded-xl font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
          >
            Explore Documentation
          </a>
          <a
            href="https://github.com/orbitnorth/froot"
            target="_blank"
            rel="noopener noreferrer"
            class="px-6 py-3 rounded-xl font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors border border-slate-700"
          >
            GitHub Repository
          </a>
        </div>

        {/* Feature Grid */}
        <div id="features" class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left">
          <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div class="text-emerald-400 text-2xl mb-3">📂</div>
            <h3 class="text-lg font-bold text-white mb-2">File-Based Routing</h3>
            <p class="text-sm text-slate-400">Next.js App Router conventions with src/app, bracket params [slug], and nested layouts.</p>
          </div>
          <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div class="text-emerald-400 text-2xl mb-3">🎨</div>
            <h3 class="text-lg font-bold text-white mb-2">Tailwind CSS v4</h3>
            <p class="text-sm text-slate-400">Built-in real CSS-first configuration via @theme without bloated runtime CDN scripts.</p>
          </div>
          <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div class="text-emerald-400 text-2xl mb-3">⚡</div>
            <h3 class="text-lg font-bold text-white mb-2">120,000+ Req/Sec</h3>
            <p class="text-sm text-slate-400">Ultra-fast monomorphic HTTP core outperforming standard Node.js frameworks by 10x.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
`,

      'src/app/docs/layout.tsx': `import type { ComponentChildren } from 'preact';

export interface DocsLayoutProps {
  currentPath: string;
  children: ComponentChildren;
}

export default function DocsLayout({ currentPath, children }: DocsLayoutProps) {
  const links = [
    { href: '/docs', title: 'Overview' },
    { href: '/docs/quickstart', title: 'Quickstart' },
  ];

  return (
    <div class="flex min-h-screen">
      {/* NO NAVBAR ON DOCS! Left sidebar handles all navigation */}
      <aside class="w-72 bg-slate-900 border-r border-slate-800 p-6 flex flex-col shrink-0">
        <a href="/" class="text-base font-bold text-white mb-6 flex items-center gap-2">
          <span>🍏</span>
          <span>Froot<span class="text-emerald-400">.ts</span></span>
          <span class="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono">DOCS</span>
        </a>

        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Getting Started
        </div>

        <nav class="space-y-1">
          {links.map((link) => {
            const isActive = currentPath === link.href || (link.href === '/docs' && currentPath === '/docs/overview');
            const cls = isActive
              ? 'bg-emerald-500/10 text-emerald-400 font-semibold border-l-2 border-emerald-400 pl-2.5'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60';

            return (
              <a
                key={link.href}
                href={link.href}
                class={\`block px-3 py-2 text-xs rounded-lg transition-colors \${cls}\`}
              >
                {link.title}
              </a>
            );
          })}
        </nav>

        <div class="mt-auto pt-6 border-t border-slate-800 text-xs text-slate-400">
          <a href="/" class="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
            <span>&larr;</span>
            <span>Back to Home</span>
          </a>
        </div>
      </aside>

      {/* Main Document Body */}
      <main class="flex-1 max-w-4xl px-8 py-10">
        {children}
      </main>
    </div>
  );
}
`,

      'src/app/docs/page.tsx': `import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMarkdownFile } from 'froot-fullstack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const metadata = {
  title: 'Documentation Overview — Froot Fullstack',
  description: 'Overview of the high-performance Froot Fullstack framework.',
};

export default async function DocsOverviewPage() {
  const docPath = path.resolve(process.cwd(), 'content/docs/overview.md');
  const { frontmatter, html } = await renderMarkdownFile(docPath);

  return (
    <div>
      <div class="text-xs font-mono text-emerald-400 mb-2 uppercase tracking-wider">
        {frontmatter['category'] || 'Getting Started'}
      </div>
      <h1 class="text-3xl font-extrabold text-white mb-6">
        {frontmatter['title'] || 'Documentation Overview'}
      </h1>
      <article
        class="prose prose-invert max-w-none text-slate-300 leading-relaxed space-y-4"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
`,

      'src/app/docs/[slug]/page.tsx': `import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMarkdownFile } from 'froot-fullstack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateStaticParams() {
  return [
    { slug: 'overview' },
    { slug: 'quickstart' },
  ];
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const slug = params.slug || 'overview';
  return {
    title: \`\${slug.charAt(0).toUpperCase() + slug.slice(1)} — Froot Fullstack Docs\`,
  };
}

export default async function DocSlugPage({ params }: { params: { slug: string } }) {
  const slug = params.slug || 'overview';
  const docPath = path.resolve(process.cwd(), 'content/docs', \`\${slug}.md\`);
  const { frontmatter, html } = await renderMarkdownFile(docPath);

  return (
    <div>
      <div class="text-xs font-mono text-emerald-400 mb-2 uppercase tracking-wider">
        {frontmatter['category'] || 'Documentation'}
      </div>
      <h1 class="text-3xl font-extrabold text-white mb-6">
        {frontmatter['title'] || slug}
      </h1>
      <article
        class="prose prose-invert max-w-none text-slate-300 leading-relaxed space-y-4"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
`,

      'src/server.tsx': `import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Froot } from 'frootjs';
import { createAppRouter } from 'froot-fullstack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = new Froot();
export const router = createAppRouter(app);

// 1. Serve compiled Tailwind v4 CSS
const cssPath = path.resolve(__dirname, '../dist/styles.css');
router.serveCss(cssPath);

// 2. Discover file-based routes and nested layouts in src/app
const appDir = path.resolve(__dirname, 'app');
await router.discover(appDir);

const PORT = Number(process.env['PORT'] || 3000);
const isDirectEntry = process.argv[1] ? path.basename(process.argv[1]).includes('server') : false;
if (isDirectEntry && process.env['NODE_ENV'] !== 'test') {
  app.listen(PORT, () => {
    console.log(\`🍏 Froot Fullstack server running at http://localhost:\${PORT}\`);
  });
}
`,

      'src/build.ts': `/**
 * Static Site Generation (SSG) Builder
 */
process.env['FROOT_BUILD'] = 'true';

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { router } from './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, '../dist/static');

async function build() {
  console.log('🍏 Building static site with froot-fullstack...');
  const result = await router.exportStatic({ outDir });
  console.log(\`✅ Export complete in \${result.durationMs}ms: \${result.renderedRoutes.length} routes pre-rendered.\`);
}

build().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
`,
    };
  },
};
