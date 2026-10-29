# create-frootjs

The official CLI project generator for Froot applications.

Quickly spin up production-ready Froot projects with your choice of architectural patterns, complete with TypeScript configuration, onion middleware, and developer tooling.

## Quick Start

Run any of the following commands in your terminal:

```bash
# Using npm
npm create frootjs@latest

# Using pnpm
pnpm create frootjs

# Using yarn
yarn create frootjs

# Using bun
bun create frootjs
```

Or invoke the binary directly:

```bash
npx create-frootjs my-app
```

## Available Architectural Templates

| Template | Flag | Description |
| :--- | :--- | :--- |
| **MVC / Layered** | `--template mvc` | Enterprise layered pattern: routes, controllers, services, models, and middleware |
| **Modular (NestJS-style)** | `--template modular` | Feature-based domain modules (`src/modules/*`), auth guard, and error filters |
| **Streaming & SSE** | `--template streaming` | Server-Sent Events metrics, AI token streaming simulation, and HTML live client |
| **WebSocket Hub** | `--template websocket` | Cross-runtime WebSockets, pub/sub rooms hub, and interactive chat client |
| **OpenAPI 3.1 & Docs** | `--template openapi` | Auto-generated OpenAPI 3.1 JSON and Scalar interactive reference UI at `/docs` |
| **Fullstack JSX & SSR** | `--template fullstack` | Native JSX components, typed layout middleware, and zero-JS server rendering |
| **Minimal Starter** | `--template minimal` | Lean single-file API starter with JSON endpoints and CORS |

## CLI Options

```
Usage:
  npx create-frootjs [project-directory] [options]

Options:
  -t, --template <name>    Template architecture (mvc, modular, streaming, websocket, openapi, fullstack, minimal)
  --pm <manager>           Package manager to use: pnpm | npm | yarn | bun
  --git / --no-git         Initialize a git repository
  --install / --no-install Automatically install project dependencies
  -y, --yes                Accept all defaults non-interactively
  -v, --version            Display CLI version
  -h, --help               Display help information
```

### Non-Interactive Automation Example

For CI/CD or scripted setups:

```bash
npx create-frootjs my-api --template modular --pm pnpm --git --install
```

## License

MIT (c) OrbitNorth LLC
