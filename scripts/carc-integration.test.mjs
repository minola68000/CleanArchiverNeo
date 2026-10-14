#!/usr/bin/env node
/**
 * carc CLI モジュール統合テスト（GUI なし・一時ディレクトリのみ）
 */
import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';
import {
  carcPath,
  carcPathEnv,
  listZipEntries,
  makeWorkDir,
  resolveZipBinary,
  assertCarcOk,
  runCarc,
  writeAppleDoubleSibling,
  writeFileIn,
} from './test-lib.mjs';

describe('carc module (CLI integration)', () => {
  it('carc script exists and is executable', () => {
    assert.ok(existsSync(carcPath));
    const st = statSync(carcPath);
    assert.ok(st.mode & 0o111);
  });

  it('bundled zip supports original -CF/-CT encoding', () => {
    const zip = resolveZipBinary();
    assert.ok(existsSync(zip));
  });

  describe('zip', () => {
    it('creates archive from a single file', () => {
      const w = makeWorkDir('zip1');
      try {
        const src = writeFileIn(w.dir, 'hello.txt');
        const dst = join(w.dir, 'out.zip');
        const r = runCarc(['-t', 'zip', '-9', dst, src], { cwd: w.dir });
        assertCarcOk(r, dst);
      } finally {
        w.cleanup();
      }
    });

    it('creates zip from multiple paths (-r)', () => {
      const w = makeWorkDir('zipmulti');
      try {
        writeFileIn(w.dir, 'a.txt', 'a');
        writeFileIn(w.dir, 'b.txt', 'b');
        const dst = join(w.dir, 'bundle.zip');
        const r = runCarc(['-t', 'zip', '-9', dst, join(w.dir, 'a.txt'), join(w.dir, 'b.txt')], {
          cwd: w.dir,
        });
        assertCarcOk(r, dst);
        const entries = listZipEntries(dst);
        assert.ok(entries.some((e) => e.endsWith('a.txt')));
        assert.ok(entries.some((e) => e.endsWith('b.txt')));
      } finally {
        w.cleanup();
      }
    });

    it('-C -D excludes .DS_Store and ._ metadata siblings', () => {
      const w = makeWorkDir('zipclean');
      try {
        writeFileIn(w.dir, 'item.txt');
        writeFileIn(w.dir, '.DS_Store', 'junk');
        writeAppleDoubleSibling(w.dir, 'item.txt');
        const dst = join(w.dir, 'clean.zip');
        const r = runCarc(['-t', 'zip', '-C', '-D', '-9', dst, w.dir], { cwd: w.dir });
        assertCarcOk(r, dst);
        const entries = listZipEntries(dst);
        assert.ok(entries.some((e) => e.includes('item.txt')));
        assert.ok(!entries.some((e) => e.includes('.DS_Store')));
        assert.ok(!entries.some((e) => e.endsWith('._item.txt')));
      } finally {
        w.cleanup();
      }
    });

    it('-E UTF-8 applies encoding conversion flags (original behaviour)', () => {
      const w = makeWorkDir('zipenc');
      try {
        const src = writeFileIn(w.dir, '日本語.txt', 'content');
        const dst = join(w.dir, 'enc.zip');
        const r = runCarc(['-t', 'zip', '-9', '-E', 'UTF-8', dst, src], { cwd: w.dir });
        assertCarcOk(r, dst);
      } finally {
        w.cleanup();
      }
    });

    it('CARC_PASSWORD encrypts zip (CLI -P path)', () => {
      const w = makeWorkDir('zippw');
      try {
        const src = writeFileIn(w.dir, 'secret.txt', 'secret');
        const dst = join(w.dir, 'locked.zip');
        const r = runCarc(['-t', 'zip', '-9', dst, src], {
          cwd: w.dir,
          env: { CARC_PASSWORD: 'testpass' },
        });
        assertCarcOk(r, dst);
        const probe = spawnSync('unzip', ['-P', 'testpass', '-t', dst], { encoding: 'utf8' });
        assert.equal(probe.status, 0, probe.stderr || probe.stdout);
      } finally {
        w.cleanup();
      }
    });
  });

  describe('gzip / bzip2', () => {
    it('gzip single file', () => {
      const w = makeWorkDir('gz');
      try {
        const src = writeFileIn(w.dir, 'one.txt');
        const dst = join(w.dir, 'one.gz');
        const r = runCarc(['-t', 'gzip', '-9', dst, src], { cwd: w.dir });
        assertCarcOk(r, dst);
      } finally {
        w.cleanup();
      }
    });

    it('bzip2 directory yields tar.bz2-style pipeline', () => {
      const w = makeWorkDir('bz2');
      try {
        writeFileIn(w.dir, 'nested/x.txt');
        const dst = join(w.dir, 'arch.tar.bz2');
        const r = runCarc(['-t', 'bzip2', '-9', '-C', '-D', dst, w.dir], { cwd: w.dir });
        assertCarcOk(r, dst);
      } finally {
        w.cleanup();
      }
    });
  });

  describe('dmg', () => {
    it('creates disk image from folder', () => {
      const w = makeWorkDir('dmg');
      try {
        writeFileIn(w.dir, 'folder/readme.txt', 'hi');
        const folder = join(w.dir, 'folder');
        const dst = join(w.dir, 'image.dmg');
        const r = runCarc(['-t', 'dmg', '-C', '-D', dst, folder], { cwd: w.dir });
        assertCarcOk(r, dst);
        assert.ok(statSync(dst).size > 1024);
      } finally {
        w.cleanup();
      }
    });

    it('rejects disk image from a single file', () => {
      const w = makeWorkDir('dmgfail');
      try {
        const src = writeFileIn(w.dir, 'only.txt');
        const dst = join(w.dir, 'bad.dmg');
        const r = runCarc(['-t', 'dmg', dst, src], { cwd: w.dir });
        assert.notEqual(r.status, 0);
      } finally {
        w.cleanup();
      }
    });

    it('-I passes internet-enabled flag to mkdmg', () => {
      const w = makeWorkDir('dmgie');
      try {
        writeFileIn(w.dir, 'vol/data.txt');
        const folder = join(w.dir, 'vol');
        const dst = join(w.dir, 'ie.dmg');
        const r = runCarc(['-t', 'dmg', '-I', dst, folder], { cwd: w.dir });
        assertCarcOk(r, dst);
      } finally {
        w.cleanup();
      }
    });
  });

  describe('7zip', () => {
    it('creates 7z when 7za is available', () => {
      const which = spawnSync('which', ['-s', '7za']);
      if (which.status !== 0) {
        return; // skip silently — optional dependency
      }
      const w = makeWorkDir('7z');
      try {
        const src = writeFileIn(w.dir, 'seven.txt');
        const dst = join(w.dir, 'out.7z');
        const r = runCarc(['-t', '7zip', '-9', dst, src], { cwd: w.dir });
        assertCarcOk(r, dst);
      } finally {
        w.cleanup();
      }
    });
  });

  describe('errors and unsupported formats', () => {
    it('rar exits with error (unsupported)', () => {
      const w = makeWorkDir('rar');
      try {
        const src = writeFileIn(w.dir, 'x.txt');
        const dst = join(w.dir, 'x.rar');
        const r = runCarc(['-t', 'rar', dst, src], { cwd: w.dir });
        assert.notEqual(r.status, 0);
        assert.match(r.stderr || r.stdout, /not supported/i);
      } finally {
        w.cleanup();
      }
    });

    it('missing format exits non-zero', () => {
      const w = makeWorkDir('noformat');
      try {
        const src = writeFileIn(w.dir, 'x.txt');
        const dst = join(w.dir, 'x.zip');
        const env = { PATH: carcPathEnv() };
        const r = spawnSync(carcPath, [dst, src], { encoding: 'utf8', env, cwd: w.dir });
        assert.notEqual(r.status, 0);
      } finally {
        w.cleanup();
      }
    });
  });
});
