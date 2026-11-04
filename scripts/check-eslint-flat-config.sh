#!/bin/sh
# Checks that the repository is linted with ESLint 10 through a flat config.
#
# Reads only tracked files (no install needed). Prints one `FAIL <check>: ...` line for every
# check that does not hold, `OK` when all hold.
#
# Exit code: 0 when ESLint 10 and a flat config are in place, 1 otherwise.
set -eu

cd "$(dirname "$0")/.."

wanted=10
failed=0

fail() {
  echo "FAIL $1"
  failed=1
}

# 1. The root devDependency `eslint` is declared with major 10.
spec=$(sed -n 's/^[[:space:]]*"eslint":[[:space:]]*"\([^"]*\)".*/\1/p' package.json | head -n 1)
major=$(printf '%s\n' "$spec" | sed -n 's/^[^0-9]*\([0-9][0-9]*\).*/\1/p')
if [ "${major:-}" != "$wanted" ]; then
  fail "eslint-major: expected $wanted, got ${major:-none} (package.json devDependencies.eslint: ${spec:-missing})"
fi

# 2. The lockfile resolves the root `eslint` to 10.x and nothing is resolved against ESLint 8 or 9.
locked=$(awk '
  /^importers:/ { importers = 1; next }
  importers && /^  \.:/ { root = 1; next }
  root && /^  [^ ]/ { exit }
  root && /^      eslint:$/ { eslint = 1; next }
  eslint && /^        version:/ { print $2; exit }
' pnpm-lock.yaml)
if [ "${locked%%.*}" != "$wanted" ]; then
  fail "eslint-lock: expected $wanted.x, got ${locked:-none} (pnpm-lock.yaml root importer)"
fi
stale=$(grep -cE '(^|[( ])eslint@(8|9)\.' pnpm-lock.yaml || true)
if [ "$stale" != "0" ]; then
  fail "eslint-peers: $stale lines of pnpm-lock.yaml still resolve against ESLint 8 or 9"
fi

# 3. Exactly one flat config is tracked at the repository root.
flat=$(git ls-files | grep -E '^eslint\.config\.(js|mjs|cjs|ts|mts|cts)$' || true)
count=$(printf '%s' "$flat" | grep -c . || true)
if [ "$count" != "1" ]; then
  fail "flat-config: expected exactly 1 eslint.config.* at the repository root, found $count"
fi

# 4. No legacy eslintrc configuration is left.
legacy=$( (git ls-files | grep -E '(^|/)(\.eslintrc(\..+)?|\.eslintignore)$'; git grep -l '"eslintConfig"' -- '*package.json') || true)
if [ -n "$legacy" ]; then
  fail "legacy-config: still present: $(printf '%s' "$legacy" | tr '\n' ' ')"
fi

if [ "$failed" = "0" ]; then
  echo "OK eslint $wanted with a flat config"
fi
exit "$failed"
