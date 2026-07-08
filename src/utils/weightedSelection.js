export function weightedSelection(entries, random) {
  const valid = entries.filter((entry) => Number(entry.weight) > 0);
  const total = valid.reduce((sum, entry) => sum + Number(entry.weight), 0);
  if (!valid.length || total <= 0) return null;
  let cursor = random.next() * total;
  for (const entry of valid) {
    cursor -= Number(entry.weight);
    if (cursor <= 0) return entry.value;
  }
  return valid.at(-1).value;
}
