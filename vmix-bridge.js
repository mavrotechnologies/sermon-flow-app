#!/usr/bin/env node
/**
 * vMix Bridge for SermonFlow
 *
 * Runs on the vMix PC. Connects to the SermonFlow server via SSE,
 * listens for vMix commands, and forwards them to the local vMix API.
 *
 * Usage:
 *   node vmix-bridge.js --url https://sermon-flow.vercel.app --room ABC123
 *
 * Options:
 *   --url     SermonFlow server URL (required)
 *   --room    Room code from the admin dashboard (required)
 *   --vmix    vMix host (default: localhost)
 *   --port    vMix port (default: 8088)
 *   --input   vMix title input number (default: 1)
 *   --ref     Reference field name (default: Headline.Text)
 *   --verse   Verse text field name (default: Description.Text)
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// ─── Parse CLI args ───────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    url: '',
    room: '',
    vmix: 'localhost',
    port: 8088,
    input: '1',
    ref: 'Headline.Text',
    verse: 'Description.Text',
  };

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    const val = args[i + 1];
    if (key && val !== undefined) {
      if (key === 'port') opts[key] = parseInt(val, 10);
      else opts[key] = val;
    }
  }

  if (!opts.url || !opts.room) {
    console.error('Usage: node vmix-bridge.js --url <server-url> --room <room-code>');
    console.error('');
    console.error('Example:');
    console.error('  node vmix-bridge.js --url https://sermon-flow.vercel.app --room ABC123');
    console.error('');
    console.error('Options:');
    console.error('  --url     SermonFlow server URL (required)');
    console.error('  --room    Room code from admin dashboard (required)');
    console.error('  --vmix    vMix host (default: localhost)');
    console.error('  --port    vMix port (default: 8088)');
    console.error('  --input   Title input number (default: 1)');
    console.error('  --ref     Reference field name (default: Headline.Text)');
    console.error('  --verse   Verse text field name (default: Description.Text)');
    process.exit(1);
  }

  return opts;
}

// ─── vMix HTTP API calls ──────────────────────────────────────────
function vmixCall(opts, params) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://${opts.vmix}:${opts.port}/api/`);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }

    http.get(url.toString(), (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(body);
        else reject(new Error(`vMix returned ${res.statusCode}: ${body}`));
      });
    }).on('error', reject);
  });
}

async function vmixSetText(opts, fieldName, value) {
  return vmixCall(opts, {
    Function: 'SetText',
    Input: opts.input,
    SelectedName: fieldName,
    Value: value,
  });
}

async function vmixOverlayIn(opts) {
  return vmixCall(opts, {
    Function: 'OverlayInput1In',
    Input: opts.input,
    Duration: '500',
  });
}

async function vmixOverlayOut(opts) {
  return vmixCall(opts, {
    Function: 'OverlayInput1Out',
    Duration: '500',
  });
}

async function handlePresent(opts, reference, verseText) {
  const ts = new Date().toLocaleTimeString();
  console.log(`[${ts}] PRESENT: ${reference}`);
  try {
    await vmixSetText(opts, opts.ref, reference);
    await vmixSetText(opts, opts.verse, verseText);
    await vmixOverlayIn(opts);
    console.log(`[${ts}]   -> Sent to vMix successfully`);
  } catch (err) {
    console.error(`[${ts}]   -> vMix error: ${err.message}`);
  }
}

async function handleHide(opts) {
  const ts = new Date().toLocaleTimeString();
  console.log(`[${ts}] HIDE overlay`);
  try {
    await vmixOverlayOut(opts);
    console.log(`[${ts}]   -> Hidden successfully`);
  } catch (err) {
    console.error(`[${ts}]   -> vMix error: ${err.message}`);
  }
}

// ─── SSE Client (no dependencies, raw HTTP) ───────────────────────
function connectSSE(opts) {
  const sseUrl = `${opts.url}/api/stream?room=${opts.room}`;
  const parsed = new URL(sseUrl);
  const transport = parsed.protocol === 'https:' ? https : http;

  const ts = () => new Date().toLocaleTimeString();

  console.log(`[${ts()}] Connecting to ${sseUrl} ...`);

  const req = transport.get(sseUrl, {
    headers: { Accept: 'text/event-stream' },
  }, (res) => {
    if (res.statusCode !== 200) {
      console.error(`[${ts()}] Server returned ${res.statusCode}`);
      scheduleReconnect(opts);
      return;
    }

    console.log(`[${ts()}] Connected! Listening for vMix commands...`);
    console.log(`[${ts()}] Room: ${opts.room} | vMix: ${opts.vmix}:${opts.port} | Input: ${opts.input}`);
    console.log('');

    let buffer = '';

    res.on('data', (chunk) => {
      buffer += chunk.toString();

      // Parse SSE events from buffer
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || ''; // Keep incomplete event in buffer

      for (const part of parts) {
        if (!part.trim()) continue;

        let eventType = '';
        let eventData = '';

        for (const line of part.split('\n')) {
          if (line.startsWith('event: ')) eventType = line.slice(7);
          else if (line.startsWith('data: ')) eventData = line.slice(6);
          else if (line.startsWith(':')) continue; // Comment / keep-alive
        }

        if (eventType === 'vmix' && eventData) {
          try {
            const msg = JSON.parse(eventData);
            const payload = msg.payload;
            if (payload?.action === 'present') {
              handlePresent(opts, payload.reference || '', payload.verseText || '');
            } else if (payload?.action === 'hide') {
              handleHide(opts);
            }
          } catch (err) {
            console.error(`[${ts()}] Failed to parse event: ${err.message}`);
          }
        }
      }
    });

    res.on('end', () => {
      console.log(`[${ts()}] Connection closed by server`);
      scheduleReconnect(opts);
    });

    res.on('error', (err) => {
      console.error(`[${ts()}] Stream error: ${err.message}`);
      scheduleReconnect(opts);
    });
  });

  req.on('error', (err) => {
    console.error(`[${ts()}] Connection error: ${err.message}`);
    scheduleReconnect(opts);
  });
}

function scheduleReconnect(opts) {
  const ts = new Date().toLocaleTimeString();
  console.log(`[${ts}] Reconnecting in 3 seconds...`);
  setTimeout(() => connectSSE(opts), 3000);
}

// ─── Test vMix connection on startup ──────────────────────────────
async function testVmix(opts) {
  const ts = new Date().toLocaleTimeString();
  try {
    const body = await new Promise((resolve, reject) => {
      const url = `http://${opts.vmix}:${opts.port}/api/`;
      http.get(url, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });

    if (body.includes('vmix')) {
      console.log(`[${ts}] vMix connection OK (${opts.vmix}:${opts.port})`);
      return true;
    }
    console.error(`[${ts}] Response doesn't look like vMix`);
    return false;
  } catch (err) {
    console.error(`[${ts}] Cannot reach vMix at ${opts.vmix}:${opts.port} — ${err.message}`);
    return false;
  }
}

// ─── Main ─────────────────────────────────────────────────────────
async function main() {
  const opts = parseArgs();

  console.log('');
  console.log('  SermonFlow vMix Bridge');
  console.log('  ─────────────────────');
  console.log('');

  const vmixOk = await testVmix(opts);
  if (!vmixOk) {
    console.log('');
    console.log('  WARNING: vMix is not reachable. The bridge will still');
    console.log('  connect to SermonFlow and retry vMix when commands arrive.');
    console.log('');
  }

  connectSSE(opts);
}

main();
