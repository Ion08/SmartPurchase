import fs from 'fs';

const text = fs.readFileSync('ROADMAP_260_TRACKER.csv','utf8').trim();
const lines = text.split('\n').slice(1);
const ids = lines.map((line) => Number(line.split(',')[0]));
const set = new Set(ids);
const missing = [];
for (let i = 1; i <= 260; i += 1) if (!set.has(i)) missing.push(i);
console.log('rows', lines.length);
console.log('unique_ids', set.size);
console.log('missing', missing.length ? missing.join(',') : 'none');
