/**
 * MVC / Layered Architecture Template
 * Organizes code by layer: Routes -> Controllers -> Services -> Models.
 */

import { TemplateDefinition, TemplateFileMap, COMMON_GITIGNORE, COMMON_TSCONFIG } from './types.js';

export const mvcTemplate: TemplateDefinition = {
  id: 'mvc',
  name: 'MVC',
  description: 'Controllers, services, models',
  generate: (projectName: string): TemplateFileMap => {
    return {
      'package.json': JSON.stringify(
        {
          name: projectName,
          version: '1.0.0',
          type: 'module',
          scripts: {
            dev: 'node --experimental-strip-types src/server.ts',
            build: 'tsc',
            start: 'node dist/server.js',
            test: 'node --test tests/*.test.ts',
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

Froot application built with the **MVC / Layered Architecture** pattern.

## Directory Structure

\`\`\`
src/
├── controllers/    # Request handlers & HTTP response formatting
│   ├── health.controller.ts
│   └── user.controller.ts
├── services/       # Core business logic & database interaction
│   └── user.service.ts
├── models/         # TypeScript interfaces & domain types
│   └── user.model.ts
├── routes/         # Froot route definitions & sub-app mounting
│   ├── health.routes.ts
│   ├── user.routes.ts
│   └── index.ts
├── middleware/     # Custom onion middleware
│   └── request-logger.ts
├── app.ts          # Application assembly
└── server.ts       # Server entry point
\`\`\`

## Getting Started

\`\`\`bash
# 1. Install dependencies
pnpm install

# 2. Run in development mode
pnpm run dev

# 3. Build for production
pnpm run build
pnpm start
\`\`\`
`,

      'src/models/user.model.ts': `export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  role?: 'admin' | 'user' | 'guest';
}
`,

      'src/services/user.service.ts': `import type { User, CreateUserInput } from '../models/user.model.js';

// In-memory mock database
const usersTable = new Map<string, User>([
  ['usr_1', { id: 'usr_1', name: 'Alice Smith', email: 'alice@example.com', role: 'admin', createdAt: new Date().toISOString() }],
  ['usr_2', { id: 'usr_2', name: 'Bob Jones', email: 'bob@example.com', role: 'user', createdAt: new Date().toISOString() }],
]);

export class UserService {
  static async findAll(): Promise<User[]> {
    return Array.from(usersTable.values());
  }

  static async findById(id: string): Promise<User | null> {
    return usersTable.get(id) ?? null;
  }

  static async create(input: CreateUserInput): Promise<User> {
    const id = 'usr_' + Math.random().toString(36).substring(2, 9);
    const user: User = {
      id,
      name: input.name,
      email: input.email,
      role: input.role ?? 'user',
      createdAt: new Date().toISOString(),
    };
    usersTable.set(id, user);
    return user;
  }

  static async delete(id: string): Promise<boolean> {
    return usersTable.delete(id);
  }
}
`,

      'src/controllers/health.controller.ts': `import type { Context } from 'frootjs';

export class HealthController {
  static getHealth(c: Context) {
    return c.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  }
}
`,

      'src/controllers/user.controller.ts': `import type { Context } from 'frootjs';
import { UserService } from '../services/user.service.js';
import type { CreateUserInput } from '../models/user.model.js';

export class UserController {
  static async list(c: Context) {
    const users = await UserService.findAll();
    return c.json(users);
  }

  static async getById(c: Context) {
    const id = c.req.param('id');
    const user = await UserService.findById(id);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    return c.json(user);
  }

  static async create(c: Context) {
    const body = await c.req.json<CreateUserInput>();
    if (!body.name || !body.email) {
      return c.json({ error: 'Name and email are required' }, 400);
    }
    const user = await UserService.create(body);
    return c.json(user, 201);
  }

  static async remove(c: Context) {
    const id = c.req.param('id');
    const ok = await UserService.delete(id);
    if (!ok) {
      return c.json({ error: 'User not found' }, 404);
    }
    return c.json({ success: true, message: 'User deleted' });
  }
}
`,

      'src/routes/health.routes.ts': `import { Froot } from 'frootjs';
import { HealthController } from '../controllers/health.controller.js';

export const healthRoutes = new Froot();

healthRoutes.get('/health', HealthController.getHealth);
`,

      'src/routes/user.routes.ts': `import { Froot } from 'frootjs';
import { UserController } from '../controllers/user.controller.js';

export const userRoutes = new Froot();

userRoutes.get('/users', UserController.list);
userRoutes.get('/users/:id', UserController.getById);
userRoutes.post('/users', UserController.create);
userRoutes.delete('/users/:id', UserController.remove);
`,

      'src/routes/index.ts': `import { Froot } from 'frootjs';
import { healthRoutes } from './health.routes.js';
import { userRoutes } from './user.routes.js';

export const apiRoutes = new Froot();

// Mount sub-apps
apiRoutes.route('/api', healthRoutes);
apiRoutes.route('/api', userRoutes);
`,

      'src/middleware/request-logger.ts': `import type { MiddlewareHandler } from 'frootjs';

export const requestLogger: MiddlewareHandler = async (c, next) => {
  const start = performance.now();
  await next();
  const duration = (performance.now() - start).toFixed(2);
  console.log(\`[\${c.req.method}] \${c.req.path} - \${c.statusCode} (\${duration}ms)\`);
};
`,

      'src/app.ts': `import { Froot } from 'frootjs';
import { cors } from 'frootjs/cors';
import { requestLogger } from './middleware/request-logger.js';
import { apiRoutes } from './routes/index.js';

export const app = new Froot();

// Global middleware
app.use(cors());
app.use(requestLogger);

// Mount API routes
app.route('', apiRoutes);

// Root route
app.get('/', (c) => {
  return c.json({
    message: 'Welcome to Froot MVC API',
    docs: '/api/health',
  });
});
`,

      'src/server.ts': `import { app } from './app.js';

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(\`Server is running on http://localhost:\${PORT}\`);
});
`,
    };
  },
};
