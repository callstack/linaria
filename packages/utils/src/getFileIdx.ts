let nextIdx = 1;
const processed = new Map<string, number>();

export default function getFileIdx(name: string): number {
  if (!processed.has(name)) {
    // eslint-disable-next-line no-plusplus
    processed.set(name, nextIdx++);
  }

  return processed.get(name)!;
}
