import { mkdtempSync, writeFileSync } from 'node:fs';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, type AppOptions } from './app.js';

let server: Server | undefined;

async function start(options?: AppOptions): Promise<string> {
  const app = createApp(options);
  const s = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });
  server = s;
  return `http://localhost:${(s.address() as AddressInfo).port}`;
}

afterEach(() => {
  server?.close();
  server = undefined;
  vi.restoreAllMocks();
});

function tmp(files: Record<string, string>): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'profile-'));
  for (const [name, content] of Object.entries(files)) writeFileSync(path.join(dir, name), content);
  return dir;
}

describe('GET /api/health', () => {
  it('returns {"status":"ok"}', async () => {
    const base = await start();
    const res = await fetch(`${base}/api/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });
});

describe('GET /api/profile', () => {
  it('returns the validated profile.json', async () => {
    const base = await start();
    const res = await fetch(`${base}/api/profile`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Shyamsinh Parmar');
    expect(body.portfolio).toHaveLength(19);
  });

  it('returns 500 when the profile does not match the schema', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const dir = tmp({ 'profile.json': '{"name":"x"}' });
    const base = await start({ profilePath: path.join(dir, 'profile.json') });
    const res = await fetch(`${base}/api/profile`);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Profile data is missing or invalid' });
  });

  it('returns 404 JSON for unknown API routes', async () => {
    const base = await start();
    const res = await fetch(`${base}/api/nope`);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Not found' });
  });
});

describe('static frontend', () => {
  it('serves the built frontend at /', async () => {
    const dir = tmp({ 'index.html': '<h1>built</h1>' });
    const base = await start({ staticDir: dir });
    const res = await fetch(`${base}/`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('<h1>built</h1>');
  });

  it('explains how to build when dist is missing', async () => {
    const base = await start({ staticDir: path.join(tmpdir(), 'does-not-exist-xyz') });
    const res = await fetch(`${base}/`);
    expect(res.status).toBe(503);
  });
});

describe('GET / (page served by the backend)', () => {
  it('marks the page so the frontend uses the API', async () => {
    const staticDir = tmp({ 'index.html': '<html><head></head><body></body></html>' });
    const base = await start({ staticDir });
    for (const url of [`${base}/`, `${base}/index.html`]) {
      const html = await (await fetch(url)).text();
      expect(html).toContain('<meta name="profile-source" content="api" />');
    }
  });
});
