#!/bin/sh
# Typechecks the workspace packages that use postcss (@linaria/server,
# @linaria/postcss-linaria and @linaria/atomic) against postcss 8.5.23.
#
# The committed manifests and lockfile still resolve postcss to 8.4.31, so the
# script swaps in the ones of the dependabot update to 8.5.23, installs with
# --ignore-scripts, runs `typecheck` of the three packages (`tsc --noEmit
# --composite false`, after the declarations of their dependencies are built)
# and puts the committed manifests, lockfile and install back on exit.
#
# Exit code: 0 when the packages typecheck, non-zero otherwise.
set -eu

# The head of the dependabot pull request that updates postcss to 8.5.23.
update=05b0d4ca86d3cd33a46425ad124c6308be3531e0
files="pnpm-lock.yaml packages/atomic/package.json packages/postcss-linaria/package.json packages/server/package.json"

cd "$(dirname "$0")/.."

git cat-file -e "$update^{commit}" || {
  echo "commit $update is not in this repository" >&2
  exit 2
}

# Plain output: the failure signature is matched against it.
export NO_COLOR=1 FORCE_COLOR=0

backup=$(mktemp -d)

restore() {
  status=$?
  trap - EXIT
  for file in $files; do
    cp "$backup/$(echo "$file" | tr / _)" "$file"
  done
  rm -rf "$backup"
  pnpm install --frozen-lockfile --ignore-scripts >/dev/null 2>&1 || true
  exit "$status"
}
trap restore EXIT

for file in $files; do
  cp "$file" "$backup/$(echo "$file" | tr / _)"
  git show "$update:$file" >"$file"
done

pnpm install --frozen-lockfile --ignore-scripts

pnpm --filter ./packages/atomic --filter ./packages/postcss-linaria --filter ./packages/server list postcss --depth 0

# --continue: report the errors of every package, not only of the first one
# that fails.
pnpm exec turbo run typecheck --force --continue \
  --filter=@linaria/atomic \
  --filter=@linaria/postcss-linaria \
  --filter=@linaria/server
