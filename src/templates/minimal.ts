/**
 * Minimal Starter Template
 * Clean, single-file starter project for microservices, quick prototypes, or lightweight APIs.
 */

import { TemplateDefinition, TemplateFileMap, COMMON_GITIGNORE, COMMON_TSCONFIG } from './types.js';

export const minimalTemplate: TemplateDefinition = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Lean single-file starter',
  generate: (projectName: string): TemplateFileMap => {
    return {
      'package.json': JSON.stringify(
        {
          name: projectName,
          version: '1.0.0',
          type: 'module',
          scripts: {
            dev: 'tsx watch src/index.ts',
            build: 'tsc',
            start: 'node dist/index.js',
          },
          dependencies: {
            frootjs: '^1.0.2',
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

      'tsconfig.json': COMMON_TSCONFIG,
      '.gitignore': COMMON_GITIGNORE,

      'README.md': `# ${projectName}

Lean, high-performance web service built with **Froot**.

## Getting Started

\`\`\`bash
# 1. Install dependencies
pnpm install

# 2. Run in development mode
pnpm run dev

# 3. Test endpoint
curl http://localhost:3000/
\`\`\`
`,

      'src/index.ts': `import { Froot } from 'frootjs';
import { cors } from 'frootjs/cors';

export const app = new Froot();

// Middleware
app.use(cors());

// Routes
app.get('/', (c) => {
  return c.json({
    message: 'Hello from Froot!',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    uptime: process.uptime(),
  });
});

app.post('/echo', async (c) => {
  const body = await c.req.json();
  return c.json({
    received: body,
    headers: {
      userAgent: c.req.header('user-agent'),
    },
  });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(\`Server is running on http://localhost:\${PORT}\`);
});
`,
    };
  },
};
