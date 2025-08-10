import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const network = process.env.DFX_NETWORK || 'local';
function run(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
}

let canisterId = process.env.VITE_TOKEN_CANISTER_ID;
try {
  if (!canisterId) {
    canisterId = run(`dfx canister id token${network ? ` --network ${network}` : ''}`);
  }
} catch (e) {
  // Ignore if dfx not available during manual builds
}

const host = network === 'local' ? 'http://127.0.0.1:4943' : 'https://icp0.io';

const envPath = resolve(__dirname, '..', '.env');
const lines = [
  `VITE_IC_HOST=${host}`,
  canisterId ? `VITE_TOKEN_CANISTER_ID=${canisterId}` : null,
].filter(Boolean);

writeFileSync(envPath, lines.join('\n'));
console.log(`[env] wrote ${envPath}:`);
console.log(lines.join('\n'));


