import { randomBytes } from 'node:crypto';
import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { join } from 'node:path';

export const MAX_BYTES = 5 * 1024 * 1024;
export const TTL_MS = 24 * 60 * 60 * 1000;

const EXTENSIONS = new Map([
  ['audio/mp4', 'm4a'],
  ['audio/webm', 'webm'],
  ['audio/ogg', 'ogg'],
]);
const TOKEN = /^[A-Za-z0-9_-]{32,128}$/;

function httpError(message, status) {
  return Object.assign(new Error(message), { status });
}

export class RecordingStore {
  constructor(root, now = Date.now) {
    this.root = root;
    this.now = now;
  }

  async init() {
    await mkdir(this.root, { recursive: true, mode: 0o750 });
  }

  async put(body, mime) {
    const extension = EXTENSIONS.get(mime);
    if (!extension) throw httpError('Unsupported type', 415);
    if (body.byteLength > MAX_BYTES) throw httpError('Too large', 413);

    const token = randomBytes(24).toString('base64url');
    const expiresAt = this.now() + TTL_MS;
    const audioPath = join(this.root, `${token}.${extension}`);
    const audioTempPath = `${audioPath}.tmp`;
    const metadataPath = join(this.root, `${token}.json`);
    const metadataTempPath = `${metadataPath}.tmp`;
    const metadata = JSON.stringify({ token, mime, extension, expiresAt });

    try {
      await writeFile(audioTempPath, body, { mode: 0o640 });
      await rename(audioTempPath, audioPath);
      await writeFile(metadataTempPath, metadata, { mode: 0o640 });
      await rename(metadataTempPath, metadataPath);
    } catch (error) {
      await Promise.allSettled([
        rm(audioTempPath, { force: true }),
        rm(metadataTempPath, { force: true }),
      ]);
      throw error;
    }

    return { token, expiresAt };
  }

  async get(token) {
    if (!TOKEN.test(token)) throw httpError('Bad token', 400);

    const metadataPath = join(this.root, `${token}.json`);
    let metadata;
    try {
      metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
    } catch {
      throw httpError('Not found', 404);
    }

    const extension = EXTENSIONS.get(metadata.mime);
    if (!extension || metadata.extension !== extension) throw httpError('Not found', 404);
    const audioPath = join(this.root, `${token}.${extension}`);
    if (metadata.expiresAt <= this.now()) {
      await Promise.allSettled([
        rm(audioPath, { force: true }),
        rm(metadataPath, { force: true }),
      ]);
      throw httpError('Expired', 410);
    }

    try {
      return { ...metadata, body: await readFile(audioPath) };
    } catch {
      throw httpError('Not found', 404);
    }
  }

  async cleanup() {
    const names = await readdir(this.root);
    for (const name of names.filter((value) => value.endsWith('.json'))) {
      const token = name.slice(0, -5);
      try {
        await this.get(token);
      } catch (error) {
        if (![400, 404, 410].includes(error.status)) throw error;
      }
    }
  }
}
