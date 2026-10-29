/**
 * Database & ORM Add-on for create-frootjs
 * Injects Drizzle ORM or Prisma into generated projects with SQLite starters.
 */

export type DatabaseOption = 'none' | 'drizzle' | 'prisma';

export interface PackageJsonLike {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

export function applyDatabaseAddon(
  files: Record<string, string>,
  dbOption: DatabaseOption
): void {
  if (dbOption === 'none') return;

  const pkgJsonStr = files['package.json'];
  if (!pkgJsonStr) return;

  const pkg: PackageJsonLike = JSON.parse(pkgJsonStr);
  pkg.scripts = pkg.scripts || {};
  pkg.dependencies = pkg.dependencies || {};
  pkg.devDependencies = pkg.devDependencies || {};

  if (dbOption === 'drizzle') {
    pkg.dependencies['drizzle-orm'] = '^0.39.0';
    pkg.dependencies['better-sqlite3'] = '^11.8.0';
    pkg.devDependencies['@types/better-sqlite3'] = '^7.6.12';
    pkg.devDependencies['drizzle-kit'] = '^0.30.0';

    pkg.scripts['db:push'] = 'drizzle-kit push';
    pkg.scripts['db:studio'] = 'drizzle-kit studio';

    files['drizzle.config.ts'] = `import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'sqlite.db',
  },
});
`;

    files['src/db/schema.ts'] = `import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
`;

    files['src/db/index.ts'] = `import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

const sqlite = new Database('sqlite.db');
export const db = drizzle(sqlite, { schema });
export * from './schema.js';
`;
  } else if (dbOption === 'prisma') {
    pkg.dependencies['@prisma/client'] = '^6.4.0';
    pkg.devDependencies['prisma'] = '^6.4.0';

    pkg.scripts['db:push'] = 'prisma db push';
    pkg.scripts['db:studio'] = 'prisma studio';
    pkg.scripts['db:generate'] = 'prisma generate';

    files['prisma/schema.prisma'] = `datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
}
`;

    files['src/db/index.ts'] = `import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
export * from '@prisma/client';
`;
  }

  // Update package.json
  files['package.json'] = JSON.stringify(pkg, null, 2) + '\n';
}
