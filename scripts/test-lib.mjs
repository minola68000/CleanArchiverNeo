import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(scriptsDir, '..');

export const carcPath = join(repoRoot, 'CleanArchiver', 'carc');

/** @returns {string} */
export function resolveZipBinary() {
  const candidates = [
    join(repoRoot, 'zip', 'zip'),
    '/Applications/CleanArchiver.app/Contents/Resources/zip',
  ];
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    const probe = spawnSync(p, ['-q', '-CF', 'UTF-8-MAC', '-CT', 'UTF-8', '/dev/null'], {
      encoding: 'utf8',
    });
    const err = `${probe.stderr ?? ''}${probe.stdout ?? ''}`;
    if (!err.includes("short option 'C' not supported") && !err.includes("'code-from' not supported")) {
      return p;
    }
  }
  throw new Error('No bundled zip with -CF/-CT (iconv) support found. Build the zip target first.');
}

/** @returns {string} */
export function carcPathEnv() {
  const zip = resolveZipBinary();
  const zipDir = dirname(zip);
  const res = join(repoRoot, 'CleanArchiver');
  return [zipDir, res, process.env.PATH].filter(Boolean).join(':');
}

/**
 * @param {string[]} args
 * @param {{ env?: Record<string, string>, cwd?: string }} [opts]
 */
export function runCarc(args, opts = {}) {
  const env = { ...process.env, PATH: carcPathEnv(), ...(opts.env ?? {}) };
  return spawnSync(carcPath, args, {
    encoding: 'utf8',
    env,
    cwd: opts.cwd ?? repoRoot,
  });
}

/** @param {import('node:child_process').SpawnSyncReturns<string>} result */
export function assertCarcOk(result, dstPath, message = '') {
  const detail = message || result.stderr || result.stdout || '';
  assert.ok(
    result.status === 0 || result.status === null,
    `carc failed (${result.status}): ${detail}`,
  );
  if (dstPath) {
    assert.ok(existsSync(dstPath), `expected output: ${dstPath}`);
    assert.ok(statSync(dstPath).size > 0, `empty output: ${dstPath}`);
  }
}

export function makeWorkDir(name) {
  const dir = mkdtempSync(join(tmpdir(), `can-${name}-`));
  return {
    dir,
    cleanup() {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

export function writeFileIn(dir, rel, content = 'payload\n') {
  const full = join(dir, rel);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content, 'utf8');
  return full;
}

/** AppleDouble-style metadata file (not a real resource fork). */
export function writeAppleDoubleSibling(dir, baseName) {
  const path = join(dir, `._${baseName}`);
  writeFileSync(path, 'fake appledouble', 'utf8');
  return path;
}

export function listZipEntries(zipPath) {
  const zipinfo = spawnSync('zipinfo', ['-1', zipPath], { encoding: 'utf8' });
  if (zipinfo.status !== 0) {
    throw new Error(`zipinfo failed: ${zipinfo.stderr || zipinfo.stdout}`);
  }
  return zipinfo.stdout.trim().split('\n').filter(Boolean);
}
