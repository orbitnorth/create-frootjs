/**
 * AI Agent Context & Rules Add-on for create-frootjs
 * Generates AGENT.md and .cursorrules so AI assistants (Cursor, Claude, Copilot, Antigravity)
 * instantly understand the exact architecture, conventions, and API methods of the project.
 */

import { DatabaseOption } from './database.js';
import { LinterOption } from './linter.js';
import { TestingOption } from './testing.js';

export interface AgentContextOptions {
  projectName: string;
  templateId: string;
  templateName: string;
  pkgManager: string;
  database?: DatabaseOption;
  linter?: LinterOption;
  testing?: TestingOption;
  docker?: boolean;
}

export function generateAgentDoc(opts: AgentContextOptions): string {
  const { projectName, templateId, templateName, pkgManager, database, linter, testing, docker } = opts;

  let dbSection = '';
  if (database === 'drizzle') {
    dbSection = `
### Database: Drizzle ORM + SQLite
- Schema location: \`src/db/schema.ts\`
- Database client: \`src/db/index.ts\` (better-sqlite3)
- Migration push command: \`${pkgManager} run db:push\`
- Studio GUI command: \`${pkgManager} run db:studio\`
- When creating tables, define schema in \`schema.ts\` and export relations.
`;
  } else if (database === 'prisma') {
    dbSection = `
### Database: Prisma + SQLite
- Schema location: \`prisma/schema.prisma\`
- Push schema to database: \`${pkgManager} run db:push\`
- Generate client: \`${pkgManager} exec prisma generate\`
- Studio GUI command: \`${pkgManager} run db:studio\`
`;
  }

  let linterSection = '';
  if (linter === 'biome') {
    linterSection = `
### Linting & Formatting: Biome
- Lint command: \`${pkgManager} run lint\`
- Format command: \`${pkgManager} run format\`
- Configuration: \`biome.json\`
`;
  } else if (linter === 'eslint') {
    linterSection = `
### Linting & Formatting: ESLint + Prettier
- Lint command: \`${pkgManager} run lint\`
- Format command: \`${pkgManager} run format\`
- Configuration: \`eslint.config.js\` and \`.prettierrc\`
`;
  }

  let testSection = '';
  if (testing === 'vitest') {
    testSection = `
### Testing: Vitest
- Run tests: \`${pkgManager} test\`
- Watch mode: \`${pkgManager} run test:watch\`
- Test files location: \`tests/**/*.test.ts\`
- Preferred testing pattern: Use \`app.fetch(new Request(...))\` to test routes in-memory without opening network ports.
`;
  } else if (testing === 'node') {
    testSection = `
### Testing: Node.js Native Test Runner
- Run tests: \`${pkgManager} test\`
- Test files location: \`tests/**/*.test.ts\`
- Uses \`node:test\` and \`node:assert/strict\`.
- Preferred testing pattern: Use \`app.fetch(new Request(...))\` to test routes in-memory without opening network ports.
`;
  }

  let archGuidelines = '';
  if (templateId === 'mvc') {
    archGuidelines = `
### Architecture: MVC / Layered Architecture
- **Controllers** (\`src/controllers/\`): Handle incoming requests, extract params/body, format HTTP responses.
- **Services** (\`src/services/\`): Contain core business logic, validations, and database interactions.
- **Models** (\`src/models/\`): Define TypeScript interfaces and domain entity types.
- **Routes** (\`src/routes/\`): Mount endpoints and bind controller methods using \`new Froot()\`.
- **Middleware** (\`src/middleware/\`): Cross-cutting concerns (logging, auth, headers).
`;
  } else if (templateId === 'modular') {
    archGuidelines = `
### Architecture: Modular Feature Architecture (NestJS-style)
- **Feature Modules** (\`src/modules/<feature>/\`): Self-contained domain modules containing routes, services, and schemas.
- **Guards & Filters** (\`src/common/\`): Common auth guards and centralized error filters.
- To add a new feature: Create a new folder under \`src/modules/\` and mount the router in \`src/app.ts\` using \`app.route('/api', featureModule)\`.
`;
  } else if (templateId === 'streaming') {
    archGuidelines = `
### Architecture: Real-Time Streaming & SSE
- Uses \`streamSSE\` from \`frootjs/streaming\` for Server-Sent Events.
- Uses \`streamText\` for chunk-by-chunk token and text streaming.
`;
  } else if (templateId === 'websocket') {
    archGuidelines = `
### Architecture: WebSockets & Pub/Sub Hub
- Uses \`upgradeWebSocket\` and \`createHub\` from \`frootjs/ws\` for real-time room communication.
`;
  } else if (templateId === 'openapi') {
    archGuidelines = `
### Architecture: OpenAPI 3.1 & Interactive Docs
- Uses \`app.openapi()\` to auto-generate OpenAPI 3.1 schemas.
- Uses \`c.describe()\` or route doc options to declare parameters and response models.
- Interactive documentation UI available at \`/docs\`.
`;
  } else if (templateId === 'fullstack') {
    archGuidelines = `
### Architecture: Fullstack JSX & Server Rendering
- JSX components located in \`src/components/\` using \`frootjs/jsx\`.
- Routes return \`c.html(<Component />)\` with zero client-side JavaScript overhead.
`;
  }

  return `# AI Agent Guide: ${projectName}

Welcome! This document provides context and conventions for AI assistants (Claude, Cursor, Copilot, Antigravity, Devin) working on this codebase.

## Project Summary
- **Project Name:** ${projectName}
- **Framework:** [Froot](https://github.com/orbitnorth/froot) (\`frootjs\`)
- **Template Architecture:** ${templateName} (\`${templateId}\`)
- **Package Manager:** \`${pkgManager}\`
- **Docker Support:** ${docker ? 'Yes (Dockerfile + docker-compose.yml)' : 'No'}

## Essential Commands
\`\`\`bash
# Start development server with hot-reload
${pkgManager} run dev

# Run TypeScript compilation check
${pkgManager} run build

# Start production server
${pkgManager} start
\`\`\`
${testSection}${linterSection}${dbSection}
${archGuidelines}
## Core Froot API Rules & Conventions

### 1. Handler Signatures
Handlers receive a single Context object \`c\`:
\`\`\`ts
import { Froot } from 'frootjs';

const app = new Froot();

app.get('/users/:id', async (c) => {
  const id = c.req.param('id');
  const role = c.req.query('role');
  return c.json({ id, role });
});
\`\`\`

### 2. Request Data Extraction
- **Path Parameters:** \`c.req.param('paramName')\`
- **Query Parameters:** \`c.req.query('queryName')\`
- **JSON Body:** \`await c.req.json()\`
- **Headers:** \`c.req.header('authorization')\`
- **Cookies:** \`c.req.cookie('session')\`

### 3. Response Generation
- **JSON:** \`c.json(data, statusCode?)\`
- **Plain Text:** \`c.text(string, statusCode?)\`
- **HTML:** \`c.html(htmlStringOrJSX, statusCode?)\`
- **Redirect:** \`c.redirect(url, statusCode?)\`

### 4. Middleware Pattern
Middleware in Froot uses an onion-style async function:
\`\`\`ts
import type { MiddlewareHandler } from 'frootjs';

export const timingMiddleware: MiddlewareHandler = async (c, next) => {
  const start = performance.now();
  await next();
  const elapsed = (performance.now() - start).toFixed(2);
  c.header('X-Response-Time', \`\${elapsed}ms\`);
};
\`\`\`

### 5. CRITICAL: Anti-Patterns to AVOID
- **DO NOT** use Express-style response methods: \`res.send()\`, \`res.status().json()\` do NOT exist. Return \`c.json()\` instead.
- **DO NOT** use \`req.body\` synchronously. Always use \`await c.req.json()\`.
- **DO NOT** pass errors via \`next(err)\`. Either throw an error or handle it via \`app.onError()\`.
- **DO NOT** import from deprecated packages \`create-froot\`. The framework package is always \`frootjs\`.

### 6. Testing Conventions
Always use in-memory Web Standards \`app.fetch(request)\` for fast, port-independent tests:
\`\`\`ts
const req = new Request('http://localhost/api/health');
const res = await app.fetch(req);
const data = await res.json();
\`\`\`
`;
}

export function generateCursorRules(opts: AgentContextOptions): string {
  return `# Froot Framework Rules (.cursorrules)
# Project: ${opts.projectName} (${opts.templateName})

# Framework Conventions:
- Web framework is frootjs (TypeScript-native, high performance).
- Handlers always receive (c) context and must return Response or Promise<Response>.
- Always use c.json(body, status) or c.text(msg, status).
- Never use Express-like res.send(), res.status(), req.body.
- For async bodies, use await c.req.json().
- Route parameters: c.req.param('id').
- Query parameters: c.req.query('key').
- Sub-routers: mount using app.route(prefix, subApp).
- Package manager: ${opts.pkgManager}. Run tests using ${opts.pkgManager} test.
- Check AGENT.md for full architectural guidelines.
`;
}

export function applyAgentAddon(
  files: Record<string, string>,
  opts: AgentContextOptions
): void {
  files['AGENT.md'] = generateAgentDoc(opts);
  files['.cursorrules'] = generateCursorRules(opts);
}

