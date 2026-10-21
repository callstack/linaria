#!/bin/sh
# Checks that examples/astro-solid is on Astro 7 and Vite 8.
#
# Reads only tracked files (no install needed). Prints one `FAIL <check>: ...` line for every
# check that does not hold, `OK` when all hold.
#
# Exit code: 0 when the example is on Astro 7 and Vite 8, 1 otherwise.
set -eu

cd "$(dirname "$0")/.."

manifest=examples/astro-solid/package.json
astro_wanted=7
vite_wanted=8
failed=0

fail() {
  echo "FAIL $1"
  failed=1
}

# The major of the range a devDependency of the example is declared with (empty when missing).
declared() {
  sed -n "s/^[[:space:]]*\"$1\":[[:space:]]*\"\([^\"]*\)\".*/\1/p" "$manifest" | head -n 1
}

major() {
  printf '%s\n' "$1" | sed -n 's/^[^0-9]*\([0-9][0-9]*\).*/\1/p'
}

# The version the lockfile resolves a dependency of the example importer to (empty when missing).
locked() {
  awk -v name="$1" '
    /^importers:/ { importers = 1; next }
    importers && /^  examples\/astro-solid:/ { example = 1; next }
    example && /^  [^ ]/ { exit }
    example && $0 == "      " name ":" { dep = 1; next }
    dep && /^        version:/ { print $2; exit }
  ' pnpm-lock.yaml
}

# 1. The example declares astro with major 7.
spec=$(declared astro)
if [ "$(major "$spec")" != "$astro_wanted" ]; then
  fail "astro-major: expected $astro_wanted, got $(major "$spec" | grep . || echo none) ($manifest devDependencies.astro: ${spec:-missing})"
fi

# 2. The example declares its direct vite with major 8, the Vite that Astro 7 depends on.
spec=$(declared vite)
if [ "$(major "$spec")" != "$vite_wanted" ]; then
  fail "vite-major: expected $vite_wanted, got $(major "$spec" | grep . || echo none) ($manifest devDependencies.vite: ${spec:-missing})"
fi

# 3. The lockfile resolves astro and vite of the example importer to those majors.
version=$(locked astro)
if [ "${version%%.*}" != "$astro_wanted" ]; then
  fail "astro-lock: expected $astro_wanted.x, got ${version:-none} (pnpm-lock.yaml importer examples/astro-solid)"
fi
version=$(locked vite)
if [ "${version%%.*}" != "$vite_wanted" ]; then
  fail "vite-lock: expected $vite_wanted.x, got ${version:-none} (pnpm-lock.yaml importer examples/astro-solid)"
fi

# 4. No astro 1 is left in the lockfile.
stale=$(sed -n 's/^  \(astro@1\.[^:(]*\).*/\1/p' pnpm-lock.yaml | sort -u | tr '\n' ' ')
if [ -n "$stale" ]; then
  fail "astro-stale: pnpm-lock.yaml still locks ${stale% }"
fi

if [ "$failed" = "0" ]; then
  echo "OK examples/astro-solid on astro $astro_wanted and vite $vite_wanted"
fi
exit "$failed"
