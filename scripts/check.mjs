import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { Script } from 'node:vm';
const base = new URL('../public/', import.meta.url);
for (const file of ['app.js','site-config.js']) new Script(await readFile(new URL(file,base),'utf8'),{filename:file});
for (const page of (await readdir(base)).filter(file=>file.endsWith('.html'))) {
const html = await readFile(new URL(page,base),'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
assert.equal(ids.length,new Set(ids).size,'Duplicate HTML IDs');
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const url=match[1];
  if(url.startsWith('#')) assert(ids.includes(url.slice(1)),`Missing anchor ${url}`);
  if(url.startsWith('/')) await access(new URL(url.slice(1),base));
}
for (const image of html.matchAll(/<img\b[^>]*>/g)) assert(/\balt="[^"]*"/.test(image[0]),'Image missing alt text');
console.log(`Passed ${page}: assets, anchors, unique IDs, image alt attributes.`);
}
console.log('Passed JavaScript syntax checks.');
