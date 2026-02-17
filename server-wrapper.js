// Server wrapper that adds WebSocket proxy for Deepgram
// Wraps the Next.js standalone server to handle WS upgrades on /api/deepgram-ws

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer, WebSocket } = require('ws');

const dev = false;
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Bible keywords for Deepgram boosting
const TOP_KEYWORDS = [
  'Genesis', 'Exodus', 'Psalms', 'Proverbs', 'Isaiah',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
  'Corinthians', 'Galatians', 'Ephesians', 'Hebrews',
  'Revelation', 'Jesus', 'Christ', 'scripture',
];

function buildDeepgramUrl() {
  const params = new URLSearchParams();
  params.set('model', 'nova-3');
  params.set('language', 'en');
  params.set('smart_format', 'true');
  params.set('punctuate', 'true');
  params.set('paragraphs', 'true');
  params.set('interim_results', 'true');
  params.set('utterance_end_ms', '1000');
  params.set('vad_events', 'true');
  params.set('endpointing', '300');
  params.set('encoding', 'linear16');
  params.set('sample_rate', '16000');
  params.set('channels', '1');
  // Nova-3 uses 'keyterm' instead of 'keywords' (no intensifier needed)
  for (const kw of TOP_KEYWORDS) {
    params.append('keyterm', kw);
  }
  return `wss://api.deepgram.com/v1/listen?${params.toString()}`;
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // WebSocket server — no dedicated HTTP server, piggybacks on the Next.js one
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url, true);

    if (pathname === '/api/deepgram-ws') {
      wss.handleUpgrade(request, socket, head, (clientWs) => {
        wss.emit('connection', clientWs, request);
      });
    } else {
      // Not our route — destroy
      socket.destroy();
    }
  });

  wss.on('connection', (clientWs) => {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      clientWs.send(JSON.stringify({ error: 'DEEPGRAM_API_KEY not configured' }));
      clientWs.close();
      return;
    }

    const dgUrl = buildDeepgramUrl();
    console.log('[WS Proxy] Client connected, opening Deepgram connection...');

    console.log('[WS Proxy] Deepgram URL:', dgUrl);
    console.log('[WS Proxy] API key prefix:', apiKey.substring(0, 8) + '...');

    // Connect to Deepgram with Authorization header (server-side, no browser restrictions)
    const dgWs = new WebSocket(dgUrl, {
      headers: { Authorization: `Token ${apiKey}` },
    });

    // Capture the HTTP upgrade response for debugging
    dgWs.on('upgrade', (res) => {
      console.log('[WS Proxy] Deepgram upgrade response:', res.statusCode);
    });

    dgWs.on('unexpected-response', (req, res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        console.error(`[WS Proxy] Deepgram rejected: HTTP ${res.statusCode} - ${body}`);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ error: `Deepgram HTTP ${res.statusCode}: ${body}` }));
          clientWs.close();
        }
      });
    });

    let dgOpen = false;

    dgWs.on('open', () => {
      dgOpen = true;
      console.log('[WS Proxy] Connected to Deepgram');
      clientWs.send(JSON.stringify({ type: 'proxy_connected' }));
    });

    dgWs.on('message', (data) => {
      // Forward Deepgram responses to browser
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(data.toString());
      }
    });

    dgWs.on('close', (code, reason) => {
      console.log(`[WS Proxy] Deepgram closed: code=${code} reason=${reason}`);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close();
      }
    });

    dgWs.on('error', (err) => {
      console.error('[WS Proxy] Deepgram error:', err.message);
      // Try to get the HTTP response for more details
      if (err.message.includes('Unexpected server response')) {
        console.error('[WS Proxy] This usually means invalid API key or unsupported parameters');
      }
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ error: err.message }));
        clientWs.close();
      }
    });

    // Forward audio from browser to Deepgram
    clientWs.on('message', (data) => {
      if (dgOpen && dgWs.readyState === WebSocket.OPEN) {
        dgWs.send(data);
      }
    });

    clientWs.on('close', () => {
      console.log('[WS Proxy] Client disconnected');
      if (dgWs.readyState === WebSocket.OPEN) {
        dgWs.send(JSON.stringify({ type: 'CloseStream' }));
        dgWs.close();
      }
    });
  });

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port} (with Deepgram WS proxy)`);
  });
});
