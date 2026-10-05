import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import express, { type Express } from 'express';
import { parseProfile, type Profile } from './schema.js';

const root = path.resolve(import.meta.dirname, '../..');

export interface AppOptions {
  /** Path to the profile JSON file. */
  profilePath?: string;
  /** Directory holding the built frontend. */
  staticDir?: string;
}

export function loadProfile(profilePath: string): Profile {
  return parseProfile(JSON.parse(readFileSync(profilePath, 'utf8')));
}

export function createApp(options: AppOptions = {}): Express {
  const profilePath = options.profilePath ?? path.join(root, 'data/profile.json');
  const staticDir = options.staticDir ?? path.join(root, 'dist');
  const app = express();
  app.disable('x-powered-by');

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/profile', (_req, res) => {
    try {
      res.json(loadProfile(profilePath));
    } catch (error) {
      console.error('Invalid profile data:', error);
      res.status(500).json({ error: 'Profile data is missing or invalid' });
    }
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  if (existsSync(staticDir)) {
    app.use(express.static(staticDir));
  } else {
    app.get('/', (_req, res) => {
      res.status(503).type('text').send('Frontend not built. Run "npm run build" first.');
    });
  }

  return app;
}
