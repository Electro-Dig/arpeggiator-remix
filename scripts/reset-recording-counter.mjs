const DEFAULT_ORIGIN = 'http://127.0.0.1:8787';

function readValue(argv) {
  const index = argv.indexOf('--value');
  const value = index >= 0 ? Number(argv[index + 1]) : 0;
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error('Usage: node scripts/reset-recording-counter.mjs --value <non-negative integer>');
  }
  return value;
}

const secret = process.env.RECORDINGS_ADMIN_SECRET || '';
if (secret.length < 32) {
  throw new Error('RECORDINGS_ADMIN_SECRET must contain at least 32 characters');
}

const value = readValue(process.argv.slice(2));
const origin = process.env.RECORDINGS_ADMIN_ORIGIN || DEFAULT_ORIGIN;
const response = await fetch(`${origin}/v1/admin/counter/reset`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-recordings-admin-key': secret,
  },
  body: JSON.stringify({ value }),
});

if (!response.ok) {
  throw new Error(`Counter reset failed with HTTP ${response.status}`);
}

const result = await response.json();
console.log(`Recording counter reset to ${result.value}`);
