#!/usr/bin/env node
/**
 * Carc / carc 配線の静的チェック（回帰防止）
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const carcM = readFileSync(join(root, 'CleanArchiver/Carc.m'), 'utf8');
const carcRb = readFileSync(join(root, 'CleanArchiver/carc'), 'utf8');

describe('Carc.m / carc wiring (static)', () => {
  it('passes -I for internet-enabled DMG', () => {
    assert.match(carcM, /\[args addObject:@"-I"\]/);
  });

  it('passes GUI password via CARC_PASSWORD env', () => {
    assert.match(carcM, /CARC_PASSWORD/);
    assert.doesNotMatch(carcM, /addObject:@"-P"\][\s\S]*_archivePassword/s);
  });

  it('carc dmg -I maps to mkdmg -i', () => {
    assert.match(carcRb, /cmdline\.push\('-i'\) if dmg_ie/);
  });

  it('carc reads CARC_PASSWORD', () => {
    assert.match(carcRb, /CARC_PASSWORD/);
  });

  it('rar branch is explicitly unsupported', () => {
    assert.match(carcRb, /rar format is not supported/);
  });

  it('zip uses original -CF/-CT encoding flags', () => {
    assert.match(carcRb, /push\('-CF', 'UTF-8-MAC', '-CT', enc\)/);
  });

  it('zip handles zip exit status (including warning code 18)', () => {
    assert.match(carcRb, /unless system\(\*cmdline\)/);
    assert.match(carcRb, /st == 18/);
  });
});
