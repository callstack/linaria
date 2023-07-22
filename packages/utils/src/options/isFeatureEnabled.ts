import { Minimatch } from 'minimatch';

import type { FeatureFlag } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NoInfer<T> = [T][T extends any ? 0 : never];

const cachedMatchers = new Map<
  string,
  [nagated: boolean, matcher: Minimatch]
>();

export const isFeatureEnabled = <T extends string>(
  features:
    | {
        [K in T]?: FeatureFlag;
      }
    | undefined,
  featureName: NoInfer<T>,
  filename: string
) => {
  const value = features?.[featureName] ?? false;
  if (typeof value === 'boolean') {
    return value;
  }

  // Fast check for glob patterns
  if (value === '*' || value === '**/*') {
    return true;
  }

  const array: string[] = Array.isArray(value) ? value : [value];

  /**
   * Check rule by rule like .gitignore
   */
  return array
    .map((pattern) => {
      let matcher = cachedMatchers.get(pattern);
      if (!matcher) {
        matcher = [pattern.startsWith('!'), new Minimatch(pattern)];
        cachedMatchers.set(pattern, matcher);
      }

      return [matcher[0], matcher[1].match(filename)];
    })
    .reduce(
      (acc, [negated, match]) => (negated ? acc && match : acc || match),
      false
    );
};
