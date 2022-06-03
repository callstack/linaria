export default function isNotNull<T>(x: T | null): x is T {
  return x !== null;
}
