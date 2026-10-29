/**
 * Modular / NestJS-Style Feature Modules Template
 * Organizes code by domain feature: each module encapsulates its routes, service, schema, and types.
 */

import { TemplateDefinition, TemplateFileMap, COMMON_GITIGNORE, COMMON_TSCONFIG } from './types.js';

export const modularTemplate: TemplateDefinition = {
  id: 'modular',
  name: 'Modular Architecture (NestJS-style)',
  description: 'Domain feature modules (routes, service, schema) with common guards & filters',
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

Froot application built with the **Modular Architecture (NestJS-style)** pattern.

## Directory Structure

\`\`\`
src/
├── common/             # Cross-cutting concerns
│   ├── guards/         # Auth & role guards
│   │   └── auth.guard.ts
│   └── filters/        # Global error filters
│       └── error.filter.ts
├── modules/            # Feature modules
│   ├── auth/           # Authentication module (JWT & login)
│   │   ├── auth.routes.ts
│   │   └── auth.service.ts
│   ├── users/          # Users management module
│   │   ├── users.routes.ts
│   │   ├── users.service.ts
│   │   └── users.types.ts
│   └── products/       # Products catalog module
│       ├── products.routes.ts
│       ├── products.service.ts
│       └── products.types.ts
├── app.ts              # Root application module orchestrator
└── server.ts           # Server bootstrap
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

      'src/common/guards/auth.guard.ts': `import type { Context, MiddlewareHandler } from 'frootjs';
import { verifyJwt } from 'frootjs/jwt';

const JWT_SECRET = process.env.JWT_SECRET || 'froot-secret-key-change-in-production';

export interface AuthContextVariables {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export const authGuard: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: missing or invalid authorization header' }, 401);
  }

  const token = authHeader.slice(7).trim();
  const payload = await verifyJwt(token, JWT_SECRET);

  if (!payload) {
    return c.json({ error: 'Unauthorized: token is invalid or expired' }, 401);
  }

  c.set('user', payload);
  await next();
};
`,

      'src/common/filters/error.filter.ts': `import type { Context } from 'frootjs';

export function errorHandler(err: unknown, c: Context): Response {
  console.error('[ErrorFilter] Caught unhandled error:', err);

  if (err instanceof Error) {
    return c.json(
      {
        error: err.name,
        message: err.message,
        statusCode: 500,
      },
      500
    );
  }

  return c.json(
    {
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      statusCode: 500,
    },
    500
  );
}
`,

      'src/modules/auth/auth.service.ts': `import { signJwt } from 'frootjs/jwt';

const JWT_SECRET = process.env.JWT_SECRET || 'froot-secret-key-change-in-production';

export class AuthService {
  static async createToken(user: { id: string; email: string; role: string }): Promise<string> {
    return signJwt(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
      },
      JWT_SECRET
    );
  }
}
`,

      'src/modules/auth/auth.routes.ts': `import { Froot } from 'frootjs';
import { AuthService } from './auth.service.js';

export const authModule = new Froot();

authModule.post('/auth/login', async (c) => {
  const body = await c.req.json<{ email?: string; password?: string }>();
  if (!body.email || !body.password) {
    return c.json({ error: 'Email and password required' }, 400);
  }

  // Demo validation: any credentials pass for showcase
  const user = {
    id: 'usr_demo',
    email: body.email,
    role: 'admin',
  };

  const token = await AuthService.createToken(user);
  return c.json({
    token,
    user,
    message: 'Login successful',
  });
});
`,

      'src/modules/users/users.types.ts': `export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}
`,

      'src/modules/users/users.service.ts': `import type { UserProfile } from './users.types.js';

const mockUsers: UserProfile[] = [
  { id: 'usr_1', name: 'Ada Lovelace', email: 'ada@froot.dev', role: 'admin' },
  { id: 'usr_2', name: 'Alan Turing', email: 'alan@froot.dev', role: 'engineer' },
];

export class UsersService {
  static getAll(): UserProfile[] {
    return mockUsers;
  }

  static getById(id: string): UserProfile | undefined {
    return mockUsers.find((u) => u.id === id);
  }
}
`,

      'src/modules/users/users.routes.ts': `import { Froot } from 'frootjs';
import { UsersService } from './users.service.js';
import { authGuard } from '../../common/guards/auth.guard.js';

export const usersModule = new Froot();

// Public route: list users
usersModule.get('/users', (c) => {
  return c.json(UsersService.getAll());
});

// Protected route: user details (guarded by JWT)
usersModule.get('/users/:id', authGuard, (c) => {
  const id = c.req.param('id');
  const user = UsersService.getById(id);
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  return c.json(user);
});
`,

      'src/modules/products/products.types.ts': `export interface Product {
  id: string;
  title: string;
  price: number;
  inventory: number;
}
`,

      'src/modules/products/products.service.ts': `import type { Product } from './products.types.js';

const productsTable: Product[] = [
  { id: 'prod_1', title: 'High-Performance Microservice', price: 99.0, inventory: 50 },
  { id: 'prod_2', title: 'Real-Time Edge Gateway', price: 149.0, inventory: 25 },
];

export class ProductsService {
  static list(): Product[] {
    return productsTable;
  }

  static find(id: string): Product | undefined {
    return productsTable.find((p) => p.id === id);
  }
}
`,

      'src/modules/products/products.routes.ts': `import { Froot } from 'frootjs';
import { ProductsService } from './products.service.js';

export const productsModule = new Froot();

productsModule.get('/products', (c) => {
  return c.json(ProductsService.list());
});

productsModule.get('/products/:id', (c) => {
  const id = c.req.param('id');
  const product = ProductsService.find(id);
  if (!product) {
    return c.json({ error: 'Product not found' }, 404);
  }
  return c.json(product);
});
`,

      'src/app.ts': `import { Froot } from 'frootjs';
import { cors } from 'frootjs/cors';
import { errorHandler } from './common/filters/error.filter.js';
import { authModule } from './modules/auth/auth.routes.js';
import { usersModule } from './modules/users/users.routes.js';
import { productsModule } from './modules/products/products.routes.js';

export const app = new Froot();

// Global middleware & filters
app.use(cors());
app.onError(errorHandler);

// Mount feature modules under /api prefix
app.route('/api', authModule);
app.route('/api', usersModule);
app.route('/api', productsModule);

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    uptime: process.uptime(),
    modules: ['auth', 'users', 'products'],
  });
});
`,

      'src/server.ts': `import { app } from './app.js';

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(\`Modular Froot Server running on http://localhost:\${PORT}\`);
});
`,
    };
  },
};
