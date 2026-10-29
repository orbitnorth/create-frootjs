/**
 * Fullstack JSX & Server-Side Rendering (SSR) Template
 * Native JSX components rendered on the server with zero client JavaScript overhead.
 */

import { TemplateDefinition, TemplateFileMap, COMMON_GITIGNORE, COMMON_TSCONFIG } from './types.js';

export const fullstackTemplate: TemplateDefinition = {
  id: 'fullstack',
  name: 'Fullstack',
  description: 'Server-rendered JSX views',
  generate: (projectName: string): TemplateFileMap => {
    return {
      'package.json': JSON.stringify(
        {
          name: projectName,
          version: '1.0.0',
          type: 'module',
          scripts: {
            dev: 'node --experimental-strip-types src/server.tsx',
            build: 'tsc',
            start: 'node dist/server.js',
          },
          dependencies: {
            frootjs: '^1.0.1',
          },
          devDependencies: {
            '@types/node': '^22.10.0',
            typescript: '^5.8.0',
          },
        },
        null,
        2
      ) + '\n',

      'tsconfig.json': COMMON_TSCONFIG,
      '.gitignore': COMMON_GITIGNORE,

      'README.md': `# ${projectName}

Froot application built with the **Fullstack JSX & Server-Side Rendering (SSR)** pattern.

## Features

- **Native JSX / TSX**: Pure server-rendered JSX without React runtime baggage
- **Layout Middleware**: Automatic HTML wrapper layout with \`jsxRenderer()\`
- **Zero Client JS**: Ultra-fast initial page loads and 100% SEO-friendly markup

## Getting Started

\`\`\`bash
# 1. Install dependencies
pnpm install

# 2. Run in development mode
pnpm run dev

# 3. View in browser
http://localhost:3000
\`\`\`
`,

      'src/components/Layout.tsx': `import type { FC, PropsWithChildren } from 'frootjs/jsx';

export interface LayoutProps {
  title?: string;
}

export const Layout: FC<PropsWithChildren<LayoutProps>> = ({ title = 'Froot JSX App', children }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <style>{\`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; line-height: 1.6; }
          header { background: #1e293b; border-bottom: 1px solid #334155; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
          .logo { font-size: 1.3rem; font-weight: bold; color: #10b981; text-decoration: none; }
          nav a { color: #94a3b8; text-decoration: none; margin-left: 1.5rem; font-weight: 500; }
          nav a:hover { color: #f8fafc; }
          main { max-width: 900px; margin: 2rem auto; padding: 0 1.5rem; }
          footer { text-align: center; padding: 2rem; color: #64748b; font-size: 0.9rem; border-top: 1px solid #1e293b; margin-top: 4rem; }
        \`}</style>
      </head>
      <body>
        <header>
          <a href="/" className="logo">Froot JSX</a>
          <nav>
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/features">Features</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer>
          <p>Powered by Froot Server-Side Rendering Engine</p>
        </footer>
      </body>
    </html>
  );
};
`,

      'src/components/Card.tsx': `import type { FC, PropsWithChildren } from 'frootjs/jsx';

export interface CardProps {
  title: string;
  badge?: string;
}

export const Card: FC<PropsWithChildren<CardProps>> = ({ title, badge, children }) => {
  return (
    <div style={{
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '8px',
      padding: '1.5rem',
      marginBottom: '1.25rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{ color: '#38bdf8', fontSize: '1.2rem' }}>{title}</h3>
        {badge ? (
          <span style={{
            background: '#064e3b',
            color: '#34d399',
            fontSize: '0.75rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            fontWeight: 600,
          }}>
            {badge}
          </span>
        ) : null}
      </div>
      <div>{children}</div>
    </div>
  );
};
`,

      'src/pages/Home.tsx': `import type { FC } from 'frootjs/jsx';
import { Card } from '../components/Card.js';

export const HomePage: FC = () => {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', color: '#10b981', marginBottom: '0.5rem' }}>
          Server-Side Rendered JSX
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>
          Blazing fast HTML generated on the server with TypeScript-native JSX components.
        </p>
      </div>

      <Card title="Zero Client Runtime" badge="Performance">
        <p>No heavy virtual DOM diffing in the browser. Pure, pre-rendered semantic HTML delivered instantly.</p>
      </Card>

      <Card title="Type-Safe Views" badge="DX">
        <p>Full TypeScript compiler checking for props, children, styles, and HTML attributes.</p>
      </Card>

      <Card title="Streaming & Islands Ready" badge="Architecture">
        <p>Seamlessly compose asynchronous server components and stream output as it becomes available.</p>
      </Card>
    </div>
  );
};
`,

      'src/pages/About.tsx': `import type { FC } from 'frootjs/jsx';

export const AboutPage: FC = () => {
  return (
    <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '8px', border: '1px solid #334155' }}>
      <h1 style={{ color: '#10b981', marginBottom: '1rem' }}>About This Application</h1>
      <p style={{ marginBottom: '1rem' }}>
        This project showcases Froot's built-in JSX rendering pipeline. Unlike traditional React or Next.js setups,
        Froot renders JSX straight to HTML strings without requiring React, ReactDOM, or a Node.js bundling step.
      </p>
      <p style={{ color: '#94a3b8' }}>
        It achieves sub-millisecond page render times while maintaining full component composition.
      </p>
    </div>
  );
};
`,

      'src/server.tsx': `import { Froot } from 'frootjs';
import { jsxRenderer } from 'frootjs/jsx';
import { Layout } from './components/Layout.js';
import { HomePage } from './pages/Home.js';
import { AboutPage } from './pages/About.js';

export const app = new Froot();

// Wrap all HTML responses in the global Layout shell
app.use('*', jsxRenderer(({ children }) => {
  return <Layout>{children}</Layout>;
}));

// Route handlers
app.get('/', (c) => {
  return c.render(<HomePage />);
});

app.get('/about', (c) => {
  return c.render(<AboutPage />);
});

app.get('/features', (c) => {
  return c.render(
    <div>
      <h1 style={{ color: '#10b981', marginBottom: '1rem' }}>Framework Features</h1>
      <ul style={{ paddingLeft: '1.5rem', color: '#cbd5e1' }}>
        <li>RADIX tree router with O(K) lookup</li>
        <li>Auto-generated OpenAPI 3.1 & Scalar docs</li>
        <li>Native JSX & async component support</li>
        <li>Full WebCrypto authentication ecosystem</li>
        <li>Universal WebSockets & pub/sub hub</li>
      </ul>
    </div>
  );
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(\`Fullstack JSX server running on http://localhost:\${PORT}\`);
});
`,
    };
  },
};
