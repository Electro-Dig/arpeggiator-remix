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

const COUNTER_FILE = '_activity-counter.json';
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
    this.counterQueue = Promise.resolve();
  }

  async init() {
    await mkdir(this.root, { recursive: true, mode: 0o750 });
  }

  #withCounterLock(operation) {
    const run = this.counterQueue.then(operation, operation);
    this.counterQueue = run.then(() => undefined, () => undefined);
    return run;
  }

  async #readCounter() {
    try {
      const parsed = JSON.parse(await readFile(join(this.root, COUNTER_FILE), 'utf8'));
      if (!Number.isSafeInteger(parsed.value) || parsed.value < 0) {
        throw new Error('Invalid activity counter');
      }
      return parsed.value;
    } catch (error) {
      if (error?.code === 'ENOENT') return 0;
      throw error;
    }
  }

  async #writeCounter(value) {
    const counterPath = join(this.root, COUNTER_FILE);
    const tempPath = `${counterPath}.${randomBytes(6).toString('hex')}.tmp`;
    const body = JSON.stringify({ value, updatedAt: this.now() });
    try {
      await writeFile(tempPath, body, { mode: 0o640 });
      await rename(tempPath, counterPath);
    } catch (error) {
      await rm(tempPath, { force: true });
      throw error;
    }
    return { value };
  }

  async resetCounter(value = 0) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw httpError('Bad counter', 400);
    }
    return this.#withCounterLock(() => this.#writeCounter(value));
  }

  async put(body, mime) {
    const extension = EXTENSIONS.get(mime);
    if (!extension) throw httpError('Unsupported type', 415);
    if (body.byteLength === 0) throw httpError('Empty recording', 400);
    if (body.byteLength > MAX_BYTES) throw httpError('Too large', 413);

    const token = randomBytes(24).toString('base64url');
    const expiresAt = this.now() + TTL_MS;
    const audioPath = join(this.root, `${token}.${extension}`);
    const audioTempPath = `${audioPath}.tmp`;
    const metadataPath = join(this.root, `${token}.json`);
    const metadataTempPath = `${metadataPath}.tmp`;

    try {
      await writeFile(audioTempPath, body, { mode: 0o640 });
      await rename(audioTempPath, audioPath);

      return await this.#withCounterLock(async () => {
        const previousValue = await this.#readCounter();
        const checkinNumber = previousValue + 1;
        let counterAdvanced = false;
        try {
          await this.#writeCounter(checkinNumber);
          counterAdvanced = true;
          const metadata = JSON.stringify({
            token,
            mime,
            extension,
            expiresAt,
            checkinNumber,
          });
          await writeFile(metadataTempPath, metadata, { mode: 0o640 });
          await rename(metadataTempPath, metadataPath);
          return { token, expiresAt, checkinNumber };
        } catch (error) {
          if (counterAdvanced) {
            await this.#writeCounter(previousValue).catch(() => undefined);
          }
          throw error;
        }
      });
    } catch (error) {
      await Promise.allSettled([
        rm(audioTempPath, { force: true }),
        rm(metadataTempPath, { force: true }),
        rm(audioPath, { force: true }),
        rm(metadataPath, { force: true }),
      ]);
      throw error;
    }
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
    for (const name of names.filter((value) => value.endsWith('.json') && value !== COUNTER_FILE)) {
      const token = name.slice(0, -5);
      try {
        await this.get(token);
      } catch (error) {
        if (![400, 404, 410].includes(error.status)) throw error;
      }
    }
  }
}
