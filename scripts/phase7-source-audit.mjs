import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const REPORT = path.join(ROOT, 'docs', 'PHASE7_SOURCE_AUDIT.json');
const EXPECTED_CANONICAL_HASHES = Object.freeze({
  'GAME_DESIGN.md': '556d99d05d7896c2b02bb653cb28e8a0cb631e223edf67e3e0c1236fd7811f71',
  'TECHNICAL_SPEC.md': '8562235331a2dc229977db11a56fdb10ba0032494d4b0d0706f41bf24c903468',
  'ART_DIRECTION.md': 'aa29931c92ada05c0693ea58730986bc8b9ce8c1b8fcbf78acb4d72be8d1529a',
  'BALANCE_SPEC.md': '5fca70f1c890b1e13a3b8b17ab3c82da725491c0cca6146a7ad0a2b1f55fd107',
  'QA_CHECKLIST.md': 'b120097203b11e7f2fe025ea5767e931395f5edc7059e9821f6ab5ce1c722122',
});

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function relative(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function extractSpecifiers(source) {
  const specifiers = [];
  const staticPattern = /(?:^|\n)\s*(?:import|export)\s+(?:[^'"\n;]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  const dynamicPattern = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const pattern of [staticPattern, dynamicPattern]) {
    let match;
    while ((match = pattern.exec(source)) !== null) specifiers.push(match[1]);
  }
  return specifiers;
}

async function resolveRelativeImport(importer, specifier) {
  const base = path.resolve(path.dirname(importer), specifier);
  const candidates = path.extname(base)
    ? [base]
    : [base, `${base}.js`, `${base}.mjs`, path.join(base, 'index.js')];
  for (const candidate of candidates) {
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch {
      // Try the next supported ESM resolution candidate.
    }
  }
  return null;
}

function findCycles(graph) {
  const cycles = [];
  const visiting = new Set();
  const visited = new Set();
  const stack = [];
  const canonical = new Set();

  function visit(node) {
    if (visiting.has(node)) {
      const start = stack.indexOf(node);
      const cycle = [...stack.slice(start), node];
      const body = cycle.slice(0, -1);
      const rotations = body.map((_, index) => [...body.slice(index), ...body.slice(0, index)]);
      const key = rotations.map((rotation) => rotation.join(' -> ')).sort()[0];
      if (!canonical.has(key)) {
        canonical.add(key);
        cycles.push(cycle);
      }
      return;
    }
    if (visited.has(node)) return;
    visiting.add(node);
    stack.push(node);
    for (const dependency of graph.get(node) ?? []) visit(dependency);
    stack.pop();
    visiting.delete(node);
    visited.add(node);
  }

  for (const node of graph.keys()) visit(node);
  return cycles;
}

const sourceFiles = (await walk(SRC)).filter((file) => file.endsWith('.js')).sort();
const graph = new Map();
const missingImports = [];
const importEdges = [];
const gameplayMathRandom = [];
const invalidArenaBoundsReads = [];
const directHealthMutationOutsideComponent = [];

for (const file of sourceFiles) {
  const source = await readFile(file, 'utf8');
  const rel = relative(file);
  const dependencies = [];
  for (const specifier of extractSpecifiers(source)) {
    if (!specifier.startsWith('.')) continue;
    const resolved = await resolveRelativeImport(file, specifier);
    if (!resolved) {
      missingImports.push({ importer: rel, specifier });
      continue;
    }
    if (resolved.startsWith(SRC)) {
      const dependency = relative(resolved);
      dependencies.push(dependency);
      importEdges.push({ importer: rel, dependency });
    }
  }
  graph.set(rel, [...new Set(dependencies)].sort());

  const generationScope = rel.startsWith('src/encounter/')
    || rel.startsWith('src/run/')
    || rel.startsWith('src/elites/')
    || rel.startsWith('src/arena/')
    || rel.startsWith('src/upgrades/')
    || rel.startsWith('src/data/arena')
    || rel.startsWith('src/data/phase7')
    || rel.startsWith('src/data/elite')
    || rel === 'src/utils/SeededRandom.js'
    || rel === 'src/utils/deterministicShuffle.js'
    || rel === 'src/utils/weightedSelection.js';
  if (generationScope && source.includes('Math.random')) gameplayMathRandom.push(rel);

  const boundsPattern = /\.bounds\.(x|y|width|height)\b/g;
  let boundsMatch;
  while ((boundsMatch = boundsPattern.exec(source)) !== null) {
    invalidArenaBoundsReads.push({ file: rel, property: boundsMatch[1] });
  }

  if (rel !== 'src/components/HealthComponent.js') {
    const healthPattern = /\.health\.(?:currentHealth|maximumHealth)\s*(?:=|\+=|-=|\*=|\/=)/g;
    let healthMatch;
    while ((healthMatch = healthPattern.exec(source)) !== null) {
      const line = source.slice(0, healthMatch.index).split('\n').length;
      directHealthMutationOutsideComponent.push({ file: rel, line, expression: healthMatch[0] });
    }
  }
}

const circularImports = findCycles(graph);
const canonicalDocuments = {};
for (const [name, expectedSha256] of Object.entries(EXPECTED_CANONICAL_HASHES)) {
  const bytes = await readFile(path.join(ROOT, 'docs', name));
  const currentSha256 = sha256(bytes);
  canonicalDocuments[name] = { expectedSha256, currentSha256, match: expectedSha256 === currentSha256 };
}

const report = {
  generatedAt: new Date().toISOString(),
  scope: 'Static audit of src/**/*.js plus immutable canonical document hashes.',
  sourceFiles: sourceFiles.length,
  importEdges: importEdges.length,
  missingImports,
  circularImports,
  mathRandomInGameplayGeneration: gameplayMathRandom,
  invalidArenaBoundsReads,
  directHealthMutationOutsideComponent,
  canonicalDocuments,
  passed: missingImports.length === 0
    && circularImports.length === 0
    && gameplayMathRandom.length === 0
    && invalidArenaBoundsReads.length === 0
    && directHealthMutationOutsideComponent.length === 0
    && Object.values(canonicalDocuments).every((entry) => entry.match),
};

await writeFile(REPORT, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Phase 7 source audit: ${report.passed ? 'PASS' : 'FAIL'}`);
console.log(`Source files: ${report.sourceFiles}; import edges: ${report.importEdges}; missing: ${missingImports.length}; cycles: ${circularImports.length}.`);
if (!report.passed) process.exitCode = 1;
