/**
 * OpenAPI 3.1 & Scalar Docs Template
 * Self-documenting REST API with schema validation, OpenAPI 3.1 JSON, and Scalar interactive UI.
 */

import { TemplateDefinition, TemplateFileMap, COMMON_GITIGNORE, COMMON_TSCONFIG } from './types.js';

export const openapiTemplate: TemplateDefinition = {
  id: 'openapi',
  name: 'OpenAPI 3.1 & Interactive Docs',
  description: 'Self-documenting REST API with auto-generated OpenAPI 3.1 spec & Scalar reference UI',
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

Froot application built with the **OpenAPI 3.1 & Interactive Docs** pattern.

## Features

- **Automatic OpenAPI 3.1 Spec**: Machine-readable spec available at \`/openapi.json\`
- **Scalar Interactive UI**: Modern, high-performance API reference documentation at \`/docs\`
- **Typed Schema Contracts**: Schemas defined inline with routes, supporting JSON Schema, Standard Schema v1, and Zod

## Getting Started

\`\`\`bash
# 1. Install dependencies
pnpm install

# 2. Run in development mode
pnpm run dev

# 3. Explore Interactive Docs
http://localhost:3000/docs
\`\`\`
`,

      'src/schemas.ts': `export const TaskSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', description: 'Unique task identifier' },
    title: { type: 'string', description: 'Task title' },
    completed: { type: 'boolean', description: 'Completion status' },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'title', 'completed', 'createdAt'],
};

export const CreateTaskInputSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Title of the new task' },
  },
  required: ['title'],
};

export const ErrorResponseSchema = {
  type: 'object',
  properties: {
    error: { type: 'string', description: 'Error message' },
  },
  required: ['error'],
};
`,

      'src/routes/tasks.ts': `import { Froot } from 'frootjs';
import { TaskSchema, CreateTaskInputSchema, ErrorResponseSchema } from '../schemas.js';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

const tasks: Task[] = [
  { id: 'task_1', title: 'Spin up Froot project', completed: true, createdAt: new Date().toISOString() },
  { id: 'task_2', title: 'Explore Scalar documentation at /docs', completed: false, createdAt: new Date().toISOString() },
];

export const taskRoutes = new Froot();

// List tasks
taskRoutes.get(
  '/tasks',
  {
    summary: 'List all tasks',
    description: 'Retrieves the complete list of scheduled tasks.',
    tags: ['Tasks'],
    operationId: 'listTasks',
    response: {
      type: 'array',
      items: TaskSchema,
    },
  },
  (c) => c.json(tasks)
);

// Get task by ID
taskRoutes.get(
  '/tasks/:id',
  {
    summary: 'Get task by ID',
    tags: ['Tasks'],
    operationId: 'getTaskById',
    params: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID' },
      },
      required: ['id'],
    },
    response: TaskSchema,
    errors: {
      404: ErrorResponseSchema,
    },
  },
  (c) => {
    const id = c.req.param('id');
    const task = tasks.find((t) => t.id === id);
    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }
    return c.json(task);
  }
);

// Create task
taskRoutes.post(
  '/tasks',
  {
    summary: 'Create a new task',
    tags: ['Tasks'],
    operationId: 'createTask',
    body: CreateTaskInputSchema,
    response: TaskSchema,
    errors: {
      400: ErrorResponseSchema,
    },
  },
  async (c) => {
    const body = await c.req.json<{ title?: string }>();
    if (!body.title) {
      return c.json({ error: 'Title is required' }, 400);
    }
    const newTask: Task = {
      id: 'task_' + Math.random().toString(36).substring(2, 9),
      title: body.title,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    tasks.push(newTask);
    return c.json(newTask, 201);
  }
);
`,

      'src/server.ts': `import { Froot } from 'frootjs';
import { cors } from 'frootjs/cors';
import { taskRoutes } from './routes/tasks.js';

export const app = new Froot();

app.use(cors());

// Mount sub-routes
app.route('/api', taskRoutes);

// Root redirect to /docs
app.get('/', (c) => {
  return c.redirect('/docs');
});

// Auto-mount OpenAPI 3.1 specification (/openapi.json) and Scalar UI (/docs)
app.openapi({
  title: '${projectName} API',
  version: '1.0.0',
  description: 'Self-documenting API powered by Froot OpenAPI 3.1 & Scalar Reference UI.',
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
  console.log(\`Interactive Docs available at http://localhost:\${PORT}/docs\`);
  console.log(\`OpenAPI JSON available at http://localhost:\${PORT}/openapi.json\`);
});
`,
    };
  },
};
