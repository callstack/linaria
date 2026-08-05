import type { AnyNode } from 'postcss';

interface OriginalState {
  fields: Record<string, unknown>;
  raws: Record<string, unknown>;
}

const fieldNames = [
  'important',
  'name',
  'params',
  'prop',
  'selector',
  'text',
  'value',
] as const;

const rawNames = [
  'after',
  'afterName',
  'before',
  'between',
  'important',
  'left',
  'ownSemicolon',
  'params',
  'right',
  'selector',
  'value',
] as const;

const originalStates = new WeakMap<AnyNode, OriginalState>();

const snapshot = (value: unknown): unknown => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }

  return value;
};

const matchesSnapshot = (snapshotValue: unknown, value: unknown): boolean => {
  if (snapshotValue === value) {
    return true;
  }

  if (
    !snapshotValue ||
    typeof snapshotValue !== 'object' ||
    !value ||
    typeof value !== 'object' ||
    Array.isArray(snapshotValue) ||
    Array.isArray(value)
  ) {
    return false;
  }

  const snapshotRecord = snapshotValue as Record<string, unknown>;
  const valueRecord = value as Record<string, unknown>;
  const snapshotKeys = Object.keys(snapshotRecord);
  const valueKeys = Object.keys(valueRecord);

  return (
    snapshotKeys.length === valueKeys.length &&
    snapshotKeys.every((key) => snapshotRecord[key] === valueRecord[key])
  );
};

export const captureOriginalState = (node: AnyNode): void => {
  const fields: Record<string, unknown> = {};
  const nodeRecord = node as unknown as Record<string, unknown>;
  for (const name of fieldNames) {
    fields[name] = nodeRecord[name];
  }

  const raws: Record<string, unknown> = {};
  const rawRecord = node.raws as Record<string, unknown>;
  for (const name of rawNames) {
    raws[name] = snapshot(rawRecord[name]);
  }

  originalStates.set(node, { fields, raws });
};

export const isOriginalField = (
  node: AnyNode,
  name: string,
  value: unknown
): boolean => {
  const originalState = originalStates.get(node);
  return originalState !== undefined && originalState.fields[name] === value;
};

export const getOriginalField = (node: AnyNode, name: string): unknown =>
  originalStates.get(node)?.fields[name];

export const isOriginalRaw = (
  node: AnyNode,
  name: string,
  value: unknown
): boolean => {
  const originalState = originalStates.get(node);
  return (
    originalState !== undefined &&
    matchesSnapshot(originalState.raws[name], snapshot(value))
  );
};
