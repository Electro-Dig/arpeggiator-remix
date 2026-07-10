import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../ops/recordings/', import.meta.url);
const [nginx, service, cleanup, timer] = await Promise.all([
  readFile(new URL('nginx.conf', root), 'utf8'),
  readFile(new URL('arpeggiator-recordings.service', root), 'utf8'),
  readFile(new URL('arpeggiator-recordings-cleanup.service', root), 'utf8'),
  readFile(new URL('arpeggiator-recordings-cleanup.timer', root), 'utf8'),
]);

test('recording API is isolated behind the existing reverse proxy', () => {
  assert.match(nginx, /server_name 43-159-132-70\.sslip\.io/);
  assert.match(nginx, /proxy_pass http:\/\/127\.0\.0\.1:8787/);
  assert.match(nginx, /client_max_body_size 5m/);
  assert.match(service, /User=arprec/);
  assert.match(service, /WorkingDirectory=\/srv\/arpeggiator-recordings\/app/);
  assert.match(service, /ReadWritePaths=\/srv\/arpeggiator-recordings\/data/);
  assert.doesNotMatch(`${nginx}${service}${cleanup}${timer}`, /podcast-knowledge/);
});

test('cleanup uses the same isolated service and runs hourly', () => {
  assert.match(cleanup, /server\.mjs --cleanup/);
  assert.match(cleanup, /User=arprec/);
  assert.match(timer, /OnCalendar=hourly/);
  assert.match(timer, /Persistent=true/);
  assert.match(timer, /RandomizedDelaySec=300/);
});
