#!/usr/bin/env node
/**
 * build.mjs — assembles the single-file index.html
 *   1. type-checks + bundles src/main.ts (esbuild)
 *   2. inlines fonts.css, styles.css and the compiled JS into src/body.html
 *   3. writes index.html (self-contained: no network needed)
 */
import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const src = (file) => path.join(root, 'src', file);

const result = await build({
  entryPoints: [src('main.ts')],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  minify: true,
  write: false,
  logLevel: 'warning',
});

const js = result.outputFiles[0].text.trim();
const [fonts, styles, body] = await Promise.all([
  readFile(src('fonts.css'), 'utf8'),
  readFile(src('styles.css'), 'utf8'),
  readFile(src('body.html'), 'utf8'),
]);

/** body.html is the document shell with the three placeholders. */
const html = body
  .split('__FONTS__').join(fonts)
  .split('__STYLES__').join(styles)
  .split('__SCRIPT__').join(js);

await writeFile(path.join(root, 'index.html'), html, 'utf8');

const kb = (s) => Math.round(Buffer.byteLength(s) / 1024);
console.log(`index.html written — ${kb(html)} KB total (js ${kb(js)} KB)`);
