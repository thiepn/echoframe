import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(ROOT, 'docs', 'FILE_MANIFEST.md');
const EXCLUDED_DIRECTORIES = new Set(['node_modules', 'dist', '.git']);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && (EXCLUDED_DIRECTORIES.has(entry.name) || entry.name.startsWith('dist-'))) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function rel(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function classify(file) {
  if (['docs/GAME_DESIGN.md', 'docs/TECHNICAL_SPEC.md', 'docs/ART_DIRECTION.md', 'docs/BALANCE_SPEC.md', 'docs/QA_CHECKLIST.md'].includes(file)) {
    return ['Canonical design authority', 'Preproduction documents', 'No'];
  }
  if (file.startsWith('docs/screenshots/ECHOFRAME_phase10_')) return ['Validated Phase 10 release-candidate screenshot', 'Validation documentation', 'No'];
  if (file.startsWith('docs/screenshots/ECHOFRAME_phase9_')) return ['Validated Phase 9 runtime screenshot', 'Validation documentation', 'No'];
  if (file.startsWith('docs/screenshots/ECHOFRAME_phase7_')) return ['Validated Phase 7 runtime screenshot', 'Validation documentation', 'No'];
  if (file.startsWith('docs/screenshots/ECHOFRAME_phase6_')) return ['Validated Phase 6 runtime screenshot', 'Validation documentation', 'No'];
  if (file.startsWith('docs/screenshots/')) return ['Historical validated runtime screenshot', 'Validation documentation', 'No'];
  if (file.startsWith('docs/PHASE10_') && file.endsWith('.json')) return ['Machine-readable Phase 10 release evidence', 'Validation tooling', 'No'];
  if (file.startsWith('docs/PHASE9_') && file.endsWith('.json')) return ['Machine-readable Phase 9 validation evidence', 'Validation tooling', 'No'];
  if ((file.startsWith('docs/PHASE5_') || file.startsWith('docs/PHASE6_') || file.startsWith('docs/PHASE7_')) && file.endsWith('.json')) return ['Machine-readable validation evidence', 'Validation tooling', 'No'];
  if (file.startsWith('docs/')) return ['Project state, design extraction, or release evidence', 'Documentation', 'No'];
  if (file.startsWith('.github/')) return ['GitHub Pages CI/CD workflow', 'Repository tooling', 'No'];
  if (file.startsWith('scripts/phase10-')) return ['Phase 10 tutorial/input/release/browser/lifecycle/soak/performance validation harness', 'Validation tooling', 'No'];
  if (file.startsWith('scripts/phase9-')) return ['Phase 9 deterministic/browser/lifecycle/soak/performance validation harness', 'Validation tooling', 'No'];
  if (file.startsWith('scripts/phase7-')) return ['Phase 7 deterministic/browser/lifecycle/soak validation harness', 'Validation tooling', 'No'];
  if (file.startsWith('scripts/phase6-')) return ['Phase 6 deterministic/browser/lifecycle/soak validation harness', 'Validation tooling', 'No'];
  if (file.startsWith('scripts/phase5-')) return ['Historical Phase 5 validation harness', 'Validation tooling', 'No'];
  if (file === 'scripts/generate-file-manifest.mjs') return ['Generates this repository manifest', 'Documentation tooling', 'No'];
  if (file.startsWith('tests/')) return ['Node regression/mechanic test', 'Automated tests', 'No'];
  if (file.startsWith('src/tutorial/')) return ['Playable tutorial state, qualification, and progression logic', 'TutorialController', 'No'];
  if (file.startsWith('src/input/')) return ['Serializable binding normalization, migration, labels, and conflict validation', 'InputManager / SettingsManager', 'No'];
  if (file.startsWith('src/scoring/')) return ['Deterministic score ledger, combo, bonus, calculation, or telemetry logic', 'ScoreManager / RunFinalizationService', 'Yes'];
  if (file.startsWith('src/progression/')) return ['Breadth-only unlock, cosmetic, and Archive discovery logic', 'ProgressionManager', 'Yes'];
  if (file.startsWith('src/statistics/')) return ['Run aggregation, personal-best, recent-run, or formatting logic', 'AggregateStatisticsManager', 'Yes'];
  if (file.startsWith('src/arena/')) return ['Authored arena descriptor, generation, transform, navigation, validation, or runtime logic', 'ArenaManager / ArenaGenerator', 'Yes'];
  if (file.startsWith('src/data/')) return ['Immutable balance, definitions, settings, or authored metadata', 'Data layer', 'No'];
  if (file.startsWith('src/elites/')) return ['Elite modifier composition, eligibility, activation, lifecycle, and validation logic', 'EliteManager / EliteModifierController', 'No'];
  if (file.startsWith('src/run/')) return ['Deterministic run plan and pre-boss progression logic', 'RunProgressionController', 'No'];
  if (file.startsWith('src/encounter/')) return ['Pure threat, generation, history, validation, recovery, or spawn-planning logic', 'EncounterGenerator', 'No'];
  if (file.startsWith('src/enemy-ai/')) return ['Pure enemy behavior, state, steering, defense, or attack-space logic', 'Enemy AI', 'No'];
  if (file.startsWith('src/enemies/')) return ['Pooled Phaser-facing enemy entity', 'EnemyManager', 'Yes'];
  if (file.startsWith('src/entities/')) return ['Pooled or scene-owned gameplay entity', 'Owning gameplay manager', 'Yes'];
  if (file.startsWith('src/pools/')) return ['Bounded reusable object pool', 'Owning gameplay manager', 'Yes'];
  if (file.startsWith('src/graphics/')) return ['Procedural renderer or texture factory', 'Owning entity/scene', 'Yes'];
  if (file.startsWith('src/combat/')) return ['Faction-aware damage packet/result/resolution logic', 'DamageService', 'No'];
  if (file.startsWith('src/components/')) return ['Reusable health, invulnerability, or contact-damage component', 'Owning entity', 'Yes'];
  if (file.startsWith('src/scenes/')) return ['Phaser scene and scene-level coordination/UI', 'SceneFlowController / scene', 'Yes'];
  if (file.startsWith('src/systems/')) return ['Gameplay/application manager or simulation system', 'Named system', 'Yes'];
  if (file.startsWith('src/state/')) return ['Run/save/combat/player state model', 'GameState / RunState', 'Yes'];
  if (file.startsWith('src/ui/')) return ['Reusable keyboard/pointer UI control', 'Owning scene', 'Yes'];
  if (file.startsWith('src/upgrades/')) return ['Run-local upgrade definition, offer, or application logic', 'UpgradeManager', 'No'];
  if (file.startsWith('src/buffers/')) return ['Bounded replay/event ring buffer', 'EchoRecorder', 'Yes'];
  if (file.startsWith('src/utils/')) return ['Shared deterministic, lifecycle, storage, math, or geometry utility', 'Shared utility layer', 'No'];
  if (file.startsWith('src/styles/')) return ['Browser shell styling', 'Repository/tooling', 'No'];
  if (file.startsWith('src/')) return ['Application bootstrap or Phaser configuration', 'Application bootstrap', 'Yes'];
  if (file.startsWith('public/')) return ['Static browser/PWA asset', 'Repository/tooling', 'No'];
  return ['Repository configuration or release metadata', 'Repository/tooling', 'No'];
}

const files = (await walk(ROOT)).filter((file) => !rel(file).startsWith('.git/')).sort((a, b) => rel(a).localeCompare(rel(b)));
const rows = [];
const groups = new Map();
for (const fullPath of files) {
  const file = rel(fullPath);
  const [purpose, owner, mutable] = classify(file);
  const top = file.includes('/') ? file.split('/')[0] : '(root)';
  groups.set(top, (groups.get(top) ?? 0) + 1);
  rows.push(`| \`${file.replaceAll('|', '\\|')}\` | ${purpose} | ${owner} | ${mutable} |`);
}

const summaryRows = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([group, count]) => `| \`${group}\` | ${count} |`);
const packageMetadata = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
const output = `# File Manifest\n\n**Version:** \`${packageMetadata.version}\`  \n**Generated:** ${new Date().toISOString()}  \n**Included files:** ${files.length}  \n\nThe manifest excludes generated \`node_modules/\`, \`dist/\`, and \`.git/\` content. Runtime-mutable means the module owns or contains live game/browser state during execution; it does not mean the source file is modified at runtime.\n\n## File counts\n\n| Area | Files |\n|---|---:|\n${summaryRows.join('\n')}\n\n## Complete inventory\n\n| Path | Purpose | Primary owner | Runtime-mutable state |\n|---|---|---|---|\n${rows.join('\n')}\n`;
await writeFile(OUTPUT, output);
console.log(`Wrote ${OUTPUT} with ${files.length} files.`);
