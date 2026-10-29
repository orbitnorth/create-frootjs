/**
 * Docker & Containerization Add-on for create-frootjs
 * Generates production-ready multi-stage Dockerfile, docker-compose.yml, and .dockerignore.
 */

export interface DockerAddonConfig {
  projectName: string;
  pkgManager: 'pnpm' | 'npm' | 'yarn' | 'bun';
  entryPoint: 'dist/server.js' | 'dist/index.js';
  port?: number;
}

export function applyDockerAddon(
  files: Record<string, string>,
  config: DockerAddonConfig
): void {
  const { projectName, pkgManager, entryPoint, port = 3000 } = config;

  // 1. .dockerignore
  files['.dockerignore'] = `node_modules/
dist/
.git/
.gitignore
.env
.env.local
*.log
.pnpm-store/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
`;

  // 2. Multi-stage Dockerfile
  files['Dockerfile'] = `# Stage 1: Build & bundle
FROM node:22-alpine AS builder
WORKDIR /app

# Enable Corepack for pnpm/yarn
RUN corepack enable

COPY package*.json ./
${pkgManager === 'pnpm' ? 'COPY pnpm-lock.yaml ./\nRUN pnpm install --frozen-lockfile' : ''}${pkgManager === 'npm' ? 'COPY package-lock.json* ./\nRUN npm ci' : ''}${pkgManager === 'yarn' ? 'COPY yarn.lock* ./\nRUN yarn install --frozen-lockfile' : ''}${pkgManager === 'bun' ? 'RUN npm install -g bun && bun install' : ''}

COPY tsconfig.json ./
COPY src/ ./src/
${files['drizzle.config.ts'] ? 'COPY drizzle.config.ts ./\n' : ''}${files['prisma/schema.prisma'] ? 'COPY prisma/ ./prisma/\nRUN npx prisma generate\n' : ''}
RUN ${pkgManager === 'bun' ? 'bun' : 'npm'} run build

# Stage 2: Lean Production Runtime
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=${port}

# Run as non-root user
USER node

COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules/ ./node_modules/
COPY --from=builder --chown=node:node /app/dist/ ./dist/

EXPOSE ${port}

CMD ["node", "${entryPoint}"]
`;

  // 3. docker-compose.yml
  files['docker-compose.yml'] = `services:
  ${projectName}:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "${port}:${port}"
    environment:
      - NODE_ENV=production
      - PORT=${port}
    restart: unless-stopped
`;
}
