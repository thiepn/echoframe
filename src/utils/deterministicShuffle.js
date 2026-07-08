export function deterministicShuffle(values, random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = random.integer(0, index);
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}
