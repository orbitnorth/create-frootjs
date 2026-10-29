/**
 * WebSocket & Real-Time Pub/Sub Template
 * Universal WebSocket handling with rooms, broadcast hub, and an interactive chat client.
 */

import { TemplateDefinition, TemplateFileMap, COMMON_GITIGNORE, COMMON_TSCONFIG } from './types.js';

export const websocketTemplate: TemplateDefinition = {
  id: 'websocket',
  name: 'WebSocket',
  description: 'Real-time pub/sub rooms',
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

Froot application built with the **WebSocket & Real-Time Pub/Sub** pattern.

## Features

- **Universal WebSockets**: Powered by \`frootjs/ws\` (\`upgradeWebSocket\`)
- **Pub/Sub Room Hub**: Multi-room broadcast hub with automatic disconnect cleanup (\`createHub\`)
- **Interactive Chat Client**: Browser interface for connecting, joining rooms, and broadcasting messages

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
import { upgradeWebSocket, createHub } from 'frootjs/ws';

export const app = new Froot();
const hub = createHub();

app.use(cors());

// Web UI Chat Client
app.get('/', (c) => {
  return c.html(\`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Froot WebSocket Hub</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; }
    .container { max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1.5rem; }
    h1 { color: #10b981; font-size: 1.75rem; margin-bottom: 0.5rem; }
    .status { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.85rem; font-weight: 600; margin-bottom: 1rem; }
    .status.connected { background: #064e3b; color: #34d399; }
    .status.disconnected { background: #7f1d1d; color: #f87171; }
    #messages { height: 280px; overflow-y: auto; background: #0b0f19; border-radius: 6px; padding: 1rem; font-family: monospace; font-size: 0.9rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .msg { padding: 0.4rem 0.8rem; border-radius: 4px; background: #1e293b; }
    .msg.system { color: #38bdf8; font-style: italic; background: transparent; }
    .input-row { display: flex; gap: 0.5rem; margin-top: 1rem; }
    input[type="text"] { flex: 1; padding: 0.75rem; border-radius: 6px; border: 1px solid #334155; background: #0b0f19; color: #fff; font-size: 1rem; outline: none; }
    input[type="text"]:focus { border-color: #10b981; }
    button { background: #10b981; color: #0f172a; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: bold; cursor: pointer; }
    button:hover { background: #059669; }
  </style>
</head>
<body>
  <div class="container">
    <div>
      <h1>Froot Universal WebSocket Hub</h1>
      <p style="color: #94a3b8;">High-speed bidirectional event broadcasting</p>
    </div>

    <div class="card">
      <div id="status" class="status disconnected">Connecting...</div>
      <div id="messages"></div>
      <div class="input-row">
        <input type="text" id="chat-input" placeholder="Type a message and press Enter..." />
        <button id="send-btn">Send</button>
      </div>
    </div>
  </div>

  <script>
    const statusEl = document.getElementById('status');
    const msgBox = document.getElementById('messages');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = protocol + '//' + window.location.host + '/ws';
    let ws;

    function connect() {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        statusEl.className = 'status connected';
        statusEl.textContent = 'Connected to /ws';
        addMessage('System: Connected to live room', true);
      };
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          addMessage(payload.user + ': ' + payload.text);
        } catch {
          addMessage(event.data);
        }
      };
      ws.onclose = () => {
        statusEl.className = 'status disconnected';
        statusEl.textContent = 'Disconnected (Reconnecting...)';
        setTimeout(connect, 2000);
      };
    }

    function addMessage(text, isSystem = false) {
      const div = document.createElement('div');
      div.className = 'msg' + (isSystem ? ' system' : '');
      div.textContent = text;
      msgBox.appendChild(div);
      msgBox.scrollTop = msgBox.scrollHeight;
    }

    function sendMessage() {
      const val = input.value.trim();
      if (!val || !ws || ws.readyState !== WebSocket.OPEN) return;
      const packet = JSON.stringify({ user: 'Guest-' + Math.floor(Math.random() * 900 + 100), text: val });
      ws.send(packet);
      input.value = '';
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    connect();
  </script>
</body>
</html>\`);
});

// WebSocket Upgrade Endpoint
app.get(
  '/ws',
  upgradeWebSocket((c) => {
    const room = c.req.query('room') || 'general';

    return {
      onOpen(ws) {
        hub.subscribe(ws, room);
        const welcome = JSON.stringify({ user: 'System', text: \`New user joined #\${room}\` });
        hub.publish(room, welcome);
      },
      onMessage(ws, event) {
        hub.publish(room, String(event.data));
      },
      onClose(ws) {
        hub.unsubscribe(ws, room);
        const exit = JSON.stringify({ user: 'System', text: \`A user left #\${room}\` });
        hub.publish(room, exit);
      },
    };
  })
);

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(\`WebSocket server running on http://localhost:\${PORT}\`);
});
`,
    };
  },
};
