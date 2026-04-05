import fs from 'fs';

const featuresText = fs.readFileSync('FEATURES_ROADMAP.md', 'utf8');
const roadmapText = fs.readFileSync('ROADMAP_260_COMPLETE.md', 'utf8');

const featureMatches = [...featuresText.matchAll(/^\s*(\d{1,3})\.\s+(.+)$/gm)]
  .map((m) => ({ id: Number(m[1]), title: m[2].trim() }))
  .filter((f) => f.id >= 1 && f.id <= 260);

const featureMap = new Map();
for (const f of featureMatches) {
  if (!featureMap.has(f.id)) featureMap.set(f.id, f.title);
}

const existingStatuses = new Map();
if (fs.existsSync('ROADMAP_260_TRACKER.csv')) {
  const trackerLines = fs.readFileSync('ROADMAP_260_TRACKER.csv', 'utf8').trim().split('\n').slice(1);
  for (const line of trackerLines) {
    const parts = line.split(',');
    const id = Number(parts[0]);
    const status = parts[4];
    if (Number.isFinite(id) && status) {
      existingStatuses.set(id, status);
    }
  }
}

const phaseMatches = [...roadmapText.matchAll(/^-\s+Faza\s+(\d+):\s+(.+)$/gm)]
  .map((m) => ({
    phase: Number(m[1]),
    ids: m[2]
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => n >= 1 && n <= 260)
  }))
  .sort((a, b) => a.phase - b.phase);

const firstPhaseById = new Map();
for (const phaseBlock of phaseMatches) {
  for (const id of phaseBlock.ids) {
    if (!firstPhaseById.has(id)) firstPhaseById.set(id, phaseBlock.phase);
  }
}

const missingTitles = [];
for (let id = 1; id <= 260; id += 1) {
  if (!featureMap.has(id)) missingTitles.push(id);
}
if (missingTitles.length > 0) {
  throw new Error(`Missing titles for IDs: ${missingTitles.join(', ')}`);
}

const ids = Array.from({ length: 260 }, (_, i) => i + 1).sort((a, b) => {
  const pa = firstPhaseById.get(a) ?? 99;
  const pb = firstPhaseById.get(b) ?? 99;
  return pa - pb || a - b;
});

const rows = ids.map((id, index) => ({
  id,
  title: featureMap.get(id),
  phase: firstPhaseById.get(id) ?? 99,
  release: `R${String(Math.floor(index / 10) + 1).padStart(2, '0')}`,
  status: existingStatuses.get(id) ?? ([30, 128, 139, 244, 246].includes(id) ? 'done' : 'todo')
}));

const csvHeader = 'feature_id,title,phase,release,status,owner,priority,effort,ui_surface,dependencies,notes\n';
const csvRows = rows
  .map((row) => `${row.id},"${String(row.title).replace(/"/g, '""')}",${row.phase},${row.release},${row.status},,,,,,`)
  .join('\n');
fs.writeFileSync('ROADMAP_260_TRACKER.csv', csvHeader + csvRows + '\n');

const grouped = rows.reduce((acc, row) => {
  if (!acc[row.release]) acc[row.release] = [];
  acc[row.release].push(row);
  return acc;
}, {});

const relKeys = Object.keys(grouped).sort();
let md = '# ROADMAP 260 - Execution Board\n\n';
md += 'Execution board complet pentru toate cele 260 features, cu max 10 features per release pentru a evita UI overcrowded.\n\n';
md += '## Operating Rules\n\n';
md += '- Max 2 blocuri noi vizibile/pagina/release.\n';
md += '- Fiecare release trece prin quality + UX gates.\n';
md += '- Feature-urile avansate intra in progressive disclosure.\n\n';

for (const rel of relKeys) {
  const relRows = grouped[rel];
  const phases = [...new Set(relRows.map((r) => r.phase))].sort((a, b) => a - b).join(', ');
  md += `## ${rel} (Faze: ${phases})\n\n`;
  for (const row of relRows) {
    md += `- [${row.status === 'done' ? 'x' : ' '}] #${row.id} ${row.title}\n`;
  }
  md += '\n';
}

md += '## Release Gates\n\n';
md += '1. Teste unit/integration verzi.\n';
md += '2. Mobile + desktop UI audit fara overcrowding.\n';
md += '3. Tracking analytics activ pe feature.\n';
md += '4. Feature flag si rollback path pregatite.\n';

fs.writeFileSync('ROADMAP_260_EXECUTION_BOARD.md', md);

const validator = `import fs from 'fs';\n\nconst text = fs.readFileSync('ROADMAP_260_TRACKER.csv','utf8').trim();\nconst lines = text.split('\\n').slice(1);\nconst ids = lines.map((line) => Number(line.split(',')[0]));\nconst set = new Set(ids);\nconst missing = [];\nfor (let i = 1; i <= 260; i += 1) if (!set.has(i)) missing.push(i);\nconsole.log('rows', lines.length);\nconsole.log('unique_ids', set.size);\nconsole.log('missing', missing.length ? missing.join(',') : 'none');\n`;
fs.writeFileSync('scripts/validate-roadmap-tracker.mjs', validator);

console.log('Generated ROADMAP_260_TRACKER.csv');
console.log('Generated ROADMAP_260_EXECUTION_BOARD.md');
console.log('Generated scripts/validate-roadmap-tracker.mjs');
