/**
 * Fullstack Next.js Alternative Template
 * Powered by @froot/fullstack, Froot Core, and Preact.
 * Features nested layouts, dynamic routes, Preact SSR, SSG, and Markdown content.
 */

import { TemplateDefinition, TemplateFileMap, COMMON_GITIGNORE } from './types.js';

export const fullstackTemplate: TemplateDefinition = {
  id: 'fullstack',
  name: 'Fullstack (Next.js Alternative)',
  description: 'Next.js alternative with Preact SSR, nested layouts, SSG & Markdown',
  generate: (projectName: string): TemplateFileMap => {
    return {
      'package.json': JSON.stringify(
        {
          name: projectName,
          version: '1.0.0',
          type: 'module',
          scripts: {
            dev: 'tsx watch src/server.tsx',
            build: 'tsc',
            'build:static': 'tsx src/build.ts',
            start: 'node dist/server.js',
          },
          dependencies: {
            'froot-fullstack': '^1.0.0',
            frootjs: '^1.0.5',
            preact: '^11.1.0',
            'preact-render-to-string': '^6.8.2',
          },
          devDependencies: {
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

High-performance **Next.js alternative** powered by **Froot Framework** and **Preact**.

## Features

- ⚡ **Ultra-Fast Throughput**: 120,000+ req/sec powered by Froot's monomorphic V8 engine.
- ⚛️ **Native Preact SSR**: Lightweight 3kB component runtime without React baggage.
- 📂 **Next.js-style Architecture**:
  - Nested layout system (\`router.layout('/docs', ...)\`)
  - Dynamic route dispatch with typed parameters (\`/docs/:slug?\`)
  - Distinct layouts (e.g. landing page with navbar vs documentation with left sidebar and no navbar)
- 🚀 **Static Site Generation (SSG)**: Prerender static pages and dynamic routes with \`generateStaticParams()\`.
- 📝 **Built-in Markdown Engine**: Next.js MDX/Contentlayer alternative with zero dependencies.

## Getting Started

\`\`\`bash
# 1. Install dependencies
pnpm install

# 2. Run in development mode
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

Welcome to **Froot Fullstack**, the high-performance Next.js alternative powered by Preact and Froot.

## Design Principles

- **Monomorphic V8 Execution:** Minimal memory overhead and maximum throughput.
- **Preact Server-Side Rendering:** Clean JSX syntax with sub-millisecond render times.
- **Nested Layouts:** Dedicated layouts for different application sections (e.g. docs vs marketing).
`,

      'content/docs/quickstart.md': `---
title: Quickstart
category: Getting Started
summary: Build your first fullstack application in seconds.
---

Create routes, compose Preact components, and serve HTML with extreme performance.

## Adding Routes

Edit \`src/server.tsx\` to register your pages:

\`\`\`tsx
router.page('/about', () => <AboutPage />);
\`\`\`
`,

      'src/layouts/RootLayout.tsx': `import type { ComponentChildren } from 'preact';

export interface RootLayoutProps {
  title?: string;
  description?: string;
  children: ComponentChildren;
}

export function RootLayout({
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
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{
          __html: \`
            tailwind.config = {
              darkMode: 'class',
              theme: {
                extend: {
                  colors: {
                    froot: { 400: '#34d399', 500: '#10b981', 600: '#059669' }
                  }
                }
              }
            };
          \`
        }} />
      </head>
      <body class="bg-slate-950 text-slate-100 font-sans min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
`,

      'src/layouts/DocsLayout.tsx': `import type { ComponentChildren } from 'preact';

export interface DocsLayoutProps {
  currentPath: string;
  children: ComponentChildren;
}

export function DocsLayout({ currentPath, children }: DocsLayoutProps) {
  const links = [
    { href: '/docs', title: 'Overview' },
    { href: '/docs/quickstart', title: 'Quickstart' },
  ];

  return (
    <div class="flex min-h-screen">
      {/* NO NAVBAR ON DOCS! Left sidebar handles all navigation */}
      <aside class="w-72 bg-slate-900 border-r border-slate-800 p-6 flex flex-col">
        <a href="/" class="text-base font-bold text-white mb-6 flex items-center gap-2">
          <span>🍏</span>
          <span>Froot<span class="text-emerald-400">.ts</span></span>
          <span class="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">DOCS</span>
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
          <a href="/" class="hover:text-emerald-400 transition-colors">&larr; Back to Home</a>
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

      'src/pages/HomePage.tsx': `export function HomePage() {
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
          Next.js Alternative • Preact SSR • Monomorphic V8
        </div>

        <h1 class="text-5xl font-extrabold tracking-tight text-white mb-6">
          High-Performance <span class="text-emerald-400">Fullstack Web Engine</span>
        </h1>

        <p class="text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Engineered for extreme throughput, nested layout architecture, and zero-allocation dynamic routing.
        </p>

        <div class="flex items-center justify-center gap-4">
          <a
            href="/docs"
            class="px-6 py-3 rounded-xl font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
          >
            Explore Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
`,

      'src/pages/DocsPage.tsx': `export interface DocsPageProps {
  title: string;
  category: string;
  contentHtml: string;
}

export function DocsPage({ title, category, contentHtml }: DocsPageProps) {
  return (
    <div>
      <div class="text-xs font-mono text-emerald-400 mb-2 uppercase tracking-wider">
        {category}
      </div>
      <h1 class="text-3xl font-extrabold text-white mb-6">{title}</h1>
      <article
        class="prose prose-invert max-w-none text-slate-300 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </div>
  );
}
`,

      'src/server.tsx': `import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Froot } from 'frootjs';
import { createAppRouter, renderMarkdownFile } from 'froot-fullstack';
import { RootLayout } from './layouts/RootLayout.js';
import { DocsLayout } from './layouts/DocsLayout.js';
import { HomePage } from './pages/HomePage.js';
import { DocsPage } from './pages/DocsPage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = new Froot();
export const router = createAppRouter(app);

// 1. Docs Layout (NO TOP NAVBAR, left sidebar only)
router.layout('/docs', ({ children, currentPath }) => {
  return (
    <RootLayout title="Documentation — Froot Fullstack">
      <DocsLayout currentPath={currentPath}>
        {children}
      </DocsLayout>
    </RootLayout>
  );
});

// 2. Landing Page Route (with top navbar)
router.page('/', () => {
  return (
    <RootLayout title="Froot Fullstack — Next.js Alternative">
      <HomePage />
    </RootLayout>
  );
});

// 3. Dynamic Documentation Route (/docs and /docs/:slug)
router.page(
  '/docs/:slug?',
  async ({ params }) => {
    const slug = params['slug'] || 'overview';
    const docPath = path.resolve(__dirname, \`../content/docs/\${slug}.md\`);
    const { frontmatter, html } = await renderMarkdownFile(docPath);

    return (
      <DocsPage
        title={frontmatter['title'] || slug}
        category={frontmatter['category'] || 'Documentation'}
        contentHtml={html}
      />
    );
  },
  {
    generateStaticParams: () => [{ slug: 'overview' }, { slug: 'quickstart' }],
  }
);

const PORT = Number(process.env['PORT'] || 3000);
app.listen(PORT, () => {
  console.log(\`🍏 Froot Fullstack server running at http://localhost:\${PORT}\`);
});
`,

      'src/build.ts': `/**
 * Static Site Generation (SSG) Builder
 */
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { router } from './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, '../dist/static');

async function build() {
  console.log('🍏 Building static site with @froot/fullstack...');
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
