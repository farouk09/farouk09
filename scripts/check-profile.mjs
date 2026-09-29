import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const profile = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
assert.match(profile, /^# Farouk Abdallah\n/);
for (const heading of ["What I'm building", 'Selected projects', 'Technical interests']) {
  assert.ok(profile.includes(`\n## ${heading}\n\n`), `Missing section: ${heading}`);
}
assert.doesNotMatch(profile, /www\.zelinqa\.fr|\bNBQ\b|localhost|127\.0\.0\.1|\/Users\//);

const links = [...new Set([...profile.matchAll(/\]\((https:\/\/[^\s)]+)\)/g)].map((match) => match[1]))];
assert.equal(links.length, 9, 'Expected nine distinct public links');
for (const link of links) {
  const url = new URL(link);
  assert.ok(['zelinqa.ai', 'docs.zelinqa.ai', 'github.com', 'www.linkedin.com'].includes(url.hostname));
  assert.equal(url.username + url.password + url.search, '', 'Links must not contain credentials or query parameters');
}

if (process.argv.includes('--links')) {
  // LinkedIn restricts automated requests; its public profile URL is syntax-checked above.
  await Promise.all(links.filter((link) => !link.startsWith('https://www.linkedin.com/')).map(async (link) => {
    const response = await fetch(link, { signal: AbortSignal.timeout(15000) });
    await response.body?.cancel();
    assert.equal(response.status, 200, `${link}: HTTP ${response.status}`);
    console.log(`ok — ${link}`);
  }));
}

console.log('ok — profile sections, public links, and terminology');
