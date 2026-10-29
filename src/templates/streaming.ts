/**
 * Streaming & Server-Sent Events (SSE) Template
 * Demonstrates real-time SSE streaming, LLM-style token streaming, and an interactive HTML live client.
 */

import { TemplateDefinition, TemplateFileMap, COMMON_GITIGNORE, COMMON_TSCONFIG } from './types.js';

export const streamingTemplate: TemplateDefinition = {
  id: 'streaming',
  name: 'Streaming',
  description: 'SSE & AI token streaming',
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

Froot application built with the **Real-Time Streaming & Server-Sent Events (SSE)** pattern.

## Features

- **SSE Telemetry Channel**: Streams real-time metrics (CPU memory, active requests) using \`streamSSE\`
- **AI Token Streamer**: Demonstrates streaming LLM-style markdown tokens chunk-by-chunk using \`streamText\`
- **Live Interactive Dashboard**: Embedded web client displaying real-time graphs and live chat stream

## Getting Started

\`\`\`bash
# 1. Install dependencies
pnpm install

# 2. Run in development mode
pnpm run dev

# 3. Open in browser
http://localhost:3000
\`\`\`
`,

      'src/server.ts': `import { Froot } from 'frootjs';
import { cors } from 'frootjs/cors';
import { streamSSE, streamText, sleep } from 'frootjs/streaming';

export const app = new Froot();

app.use(cors());

// Embedded Dashboard HTML
app.get('/', (c) => {
  return c.html(\`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Froot Streaming Demo</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; }
    .container { max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1.5rem; }
    h1 { color: #10b981; font-size: 1.75rem; margin-bottom: 0.5rem; }
    h2 { font-size: 1.25rem; margin-bottom: 1rem; color: #38bdf8; }
    pre { background: #0b0f19; padding: 1rem; border-radius: 6px; overflow-x: auto; font-size: 0.9rem; line-height: 1.4; }
    .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem; }
    .metric-box { background: #0b0f19; padding: 1rem; border-radius: 6px; text-align: center; }
    .metric-value { font-size: 1.5rem; font-weight: bold; color: #10b981; }
    .metric-label { font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; margin-top: 0.25rem; }
    button { background: #10b981; color: #0f172a; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: bold; cursor: pointer; }
    button:hover { background: #059669; }
  </style>
</head>
<body>
  <div class="container">
    <div>
      <h1>Froot Streaming Engine</h1>
      <p style="color: #94a3b8;">High-throughput Server-Sent Events & chunked HTTP streaming</p>
    </div>

    <!-- SSE Metrics Card -->
    <div class="card">
      <h2>Live Telemetry Stream (SSE)</h2>
      <div class="metrics">
        <div class="metric-box">
          <div id="m-memory" class="metric-value">--</div>
          <div class="metric-label">Memory (MB)</div>
        </div>
        <div class="metric-box">
          <div id="m-uptime" class="metric-value">--</div>
          <div class="metric-label">Uptime (s)</div>
        </div>
        <div class="metric-box">
          <div id="m-count" class="metric-value">0</div>
          <div class="metric-label">Events Received</div>
        </div>
      </div>
      <pre id="sse-log">Connecting to /sse/metrics...</pre>
    </div>

    <!-- LLM Stream Card -->
    <div class="card">
      <h2>AI Token Stream Simulation</h2>
      <div style="margin-bottom: 1rem;">
        <button id="btn-stream">Generate Streaming Text</button>
      </div>
      <pre id="stream-output">Click button to trigger token-by-token stream...</pre>
    </div>
  </div>

  <script>
    // SSE Stream
    let count = 0;
    const es = new EventSource('/sse/metrics');
    const log = document.getElementById('sse-log');
    es.addEventListener('telemetry', (e) => {
      const data = JSON.parse(e.data);
      count++;
      document.getElementById('m-memory').textContent = data.memoryUsageMB;
      document.getElementById('m-uptime').textContent = data.uptimeSec;
      document.getElementById('m-count').textContent = count;
      log.textContent = 'Last event: ' + JSON.stringify(data, null, 2);
    });

    // Token Stream
    const btn = document.getElementById('btn-stream');
    const output = document.getElementById('stream-output');
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      output.textContent = '';
      const response = await fetch('/api/chat/stream');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        output.textContent += decoder.decode(value);
      }
      btn.disabled = false;
    });
  </script>
</body>
</html>\`);
});

// Real-time SSE Telemetry endpoint
app.get('/sse/metrics', (c) => {
  return streamSSE(
    c,
    async (stream) => {
      let eventId = 1;
      while (!stream.signal.aborted) {
        const mem = process.memoryUsage();
        const payload = {
          memoryUsageMB: Math.round(mem.rss / 1024 / 1024),
          uptimeSec: Math.floor(process.uptime()),
          timestamp: new Date().toISOString(),
        };

        await stream.writeSSE({
          event: 'telemetry',
          id: String(eventId++),
          data: JSON.stringify(payload),
        });

        await sleep(1000, stream.signal);
      }
    },
    { heartbeatMs: 15_000 }
  );
});

// AI Token Streaming Simulation endpoint
app.get('/api/chat/stream', (c) => {
  const sampleResponse = [
    'Hello! ', 'I ', 'am ', 'streaming ', 'from ', 'a ', 'Froot ', 'server. ',
    'Each ', 'token ', 'is ', 'dispatched ', 'with ', 'zero-copy ', 'efficiency.\\n\\n',
    'Froot ', 'supports ', 'standards-compliant ', 'WHATWG ', 'ReadableStream ',
    'pipelines ', 'compatible ', 'with ', 'all ', 'modern ', 'edge ', 'runtimes.',
  ];

  return streamText(c, async (stream) => {
    for (const chunk of sampleResponse) {
      if (stream.signal.aborted) break;
      await stream.write(chunk);
      await sleep(60, stream.signal);
    }
  });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(\`Streaming server running on http://localhost:\${PORT}\`);
});
`,
    };
  },
};
