import { readFileSync } from 'fs';
import { createServer } from 'http';
import { networkInterfaces } from 'os';

const EXT_NAME = 'eext-qrcode-generator';
// 从 extension.json 动态读取版本号，避免版本升级后硬编码失效
const EXT_VERSION = JSON.parse(
  readFileSync(new URL('../extension.json', import.meta.url), 'utf-8'),
).version;
const EXT_FILE = `build/dist/${EXT_NAME}_v${EXT_VERSION}.eext`;

async function findBridgePort() {
  for (let port = 49620; port <= 49629; port++) {
    try {
      const resp = await fetch(`http://127.0.0.1:${port}/health`);
      const json = await resp.json();
      if (json.service === 'easyeda-bridge') return port;
    } catch {}
  }
  throw new Error('Bridge not found on ports 49620-49629');
}

function getLocalIp() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return '127.0.0.1';
}

async function main() {
  const bridgePort = await findBridgePort();
  console.log(`Bridge found on port ${bridgePort}`);

  const localIp = getLocalIp();
  const httpPort = 9876;
  const fileBuffer = readFileSync(EXT_FILE);

  const server = createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.end(fileBuffer);
  });

  await new Promise(resolve => server.listen(httpPort, () => resolve()));
  console.log(`Serving ${EXT_FILE} on http://${localIp}:${httpPort}`);

  try {
    const code = `var r=await fetch("http://${localIp}:${httpPort}/");var b=await r.arrayBuffer();var f=new File([b],"p.eext",{type:"application/zip"});return await window.top._MSG_BUS2_EXTAPI_.rpcCall("extensionApi.importExtensionPackages",{files:[f],action:"import"},15000);`;
    const resp = await fetch(`http://127.0.0.1:${bridgePort}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, timeout: 30000 }),
    });
    const result = await resp.json();
    console.log('Import result:', JSON.stringify(result));
  } finally {
    server.close();
    console.log('Done');
  }
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
