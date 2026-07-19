#!/usr/bin/env node
/**
 * Aicoo Skills — print a valid access token to stdout.
 *
 * Resolution order:
 *   1. OAuth credentials (~/.aicoo/credentials.json), auto-refreshing the
 *      access token when it is within 2 minutes of expiry.
 *   2. Legacy ~/.aicoo/oauth.json (older OAuth onboarding) — migrated to
 *      credentials.json on first successful refresh.
 *   3. AICOO_API_KEY / PULSE_API_KEY environment variables.
 *
 * All diagnostics go to stderr; stdout carries only the token, so scripts
 * can safely do: TOKEN="$(node scripts/aicoo-token.mjs)".
 */
import { mkdirSync, readFileSync, writeFileSync, rmdirSync, existsSync, chmodSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const AICOO_DIR = join(homedir(), '.aicoo');
const CREDENTIALS_PATH = join(AICOO_DIR, 'credentials.json');
const LEGACY_TOKENS_PATH = join(AICOO_DIR, 'oauth.json');
const LEGACY_CLIENT_PATH = join(AICOO_DIR, 'oauth-client.json');
const LOCK_DIR = join(AICOO_DIR, '.refresh.lock');

const REFRESH_MARGIN_MS = 2 * 60 * 1000;
const LOCK_STALE_MS = 30 * 1000;
const LOCK_WAIT_MS = 10 * 1000;

const log = (...parts) => console.error(...parts);

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function apiKeyFallback() {
  const key = process.env.AICOO_API_KEY || process.env.PULSE_API_KEY;
  if (key) {
    process.stdout.write(key);
    return true;
  }
  return false;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function acquireLock() {
  const deadline = Date.now() + LOCK_WAIT_MS;
  for (;;) {
    try {
      mkdirSync(LOCK_DIR);
      return true;
    } catch {
      try {
        if (Date.now() - statSync(LOCK_DIR).mtimeMs > LOCK_STALE_MS) {
          rmdirSync(LOCK_DIR);
          continue;
        }
      } catch {
        continue; // lock vanished between checks — retry immediately
      }
      if (Date.now() > deadline) return false;
      await sleep(150);
    }
  }
}

function releaseLock() {
  try {
    rmdirSync(LOCK_DIR);
  } catch {
    // already released
  }
}

function saveCredentials(baseUrl, clientId, tokens, previous = {}) {
  const now = Date.now();
  const credentials = {
    version: 1,
    base_url: baseUrl,
    client_id: clientId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? previous.refresh_token ?? null,
    token_type: tokens.token_type ?? 'Bearer',
    scope: tokens.scope ?? previous.scope ?? '',
    expires_at: now + (tokens.expires_in ?? 900) * 1000,
    obtained_at: now,
  };
  mkdirSync(AICOO_DIR, { recursive: true });
  writeFileSync(CREDENTIALS_PATH, `${JSON.stringify(credentials, null, 2)}\n`);
  chmodSync(CREDENTIALS_PATH, 0o600);
  return credentials;
}

async function refresh(baseUrl, clientId, refreshToken, previous) {
  const response = await fetch(`${baseUrl}/api/auth/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) {
    throw new Error(body.error_description || body.error || `HTTP ${response.status}`);
  }
  return saveCredentials(baseUrl, clientId, body, previous);
}

async function main() {
  let credentials = readJson(CREDENTIALS_PATH);

  // Migrate the legacy oauth.json produced by the older onboarding flow.
  if (!credentials?.access_token) {
    const legacy = readJson(LEGACY_TOKENS_PATH);
    if (legacy?.refresh_token) {
      const legacyClient = readJson(LEGACY_CLIENT_PATH);
      credentials = {
        base_url: process.env.AICOO_BASE_URL?.replace(/\/$/, '') || 'https://www.aicoo.io',
        client_id: legacyClient?.client_id || 'aicoo-skills',
        access_token: legacy.access_token,
        refresh_token: legacy.refresh_token,
        scope: legacy.scope ?? '',
        expires_at: 0, // force refresh — legacy files carry no expiry timestamp
      };
    }
  }

  if (!credentials?.access_token) {
    if (apiKeyFallback()) return;
    log('Not signed in to Aicoo. Run: node scripts/aicoo-login.mjs');
    log('(Or create an API key at https://www.aicoo.io/settings/api-keys and export AICOO_API_KEY.)');
    process.exit(1);
  }

  if (Date.now() < (credentials.expires_at ?? 0) - REFRESH_MARGIN_MS) {
    process.stdout.write(credentials.access_token);
    return;
  }

  if (!credentials.refresh_token) {
    if (apiKeyFallback()) return;
    log('Aicoo access token expired and no refresh token is stored. Re-run: node scripts/aicoo-login.mjs');
    process.exit(1);
  }

  const locked = await acquireLock();
  try {
    // Another process may have refreshed while we waited on the lock.
    const latest = readJson(CREDENTIALS_PATH);
    if (latest?.access_token && Date.now() < (latest.expires_at ?? 0) - REFRESH_MARGIN_MS) {
      process.stdout.write(latest.access_token);
      return;
    }

    const refreshed = await refresh(
      credentials.base_url || 'https://www.aicoo.io',
      credentials.client_id || 'aicoo-skills',
      (latest ?? credentials).refresh_token ?? credentials.refresh_token,
      latest ?? credentials
    );
    process.stdout.write(refreshed.access_token);
  } catch (error) {
    if (apiKeyFallback()) return;
    log(`Token refresh failed: ${error.message}`);
    log('Re-run: node scripts/aicoo-login.mjs');
    process.exit(1);
  } finally {
    if (locked) releaseLock();
  }
}

main();
