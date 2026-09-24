#!/usr/bin/env bash
# Recipe-Grams development environment: one entry point for checking, setting
# up, and upgrading the baseline declared in dev-environment.json.
# See docs/development.md#development-environment.
set -euo pipefail

usage="Usage: ./scripts/init.sh [--check | --upgrade]
  (no option)  install missing or stale requirements, then check readiness
  --check      read-only, offline readiness check; run it before each task
  --upgrade    move managed external skills to their newest upstream releases
               and record the resolved versions in dev-environment.json"

mode=setup
case "${1-}" in
"") ;;
--check) mode=check ;;
--upgrade) mode=upgrade ;;
-h | --help)
  echo "$usage"
  exit 0
  ;;
*)
  printf 'Unknown option "%s".\n%s\n' "$1" "$usage" >&2
  exit 2
  ;;
esac
if [ $# -gt 1 ]; then
  printf '%s\n' "$usage" >&2
  exit 2
fi

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

# Setup only supports Apple Silicon macOS today; add other hosts here.
system="$(uname -s)"
machine="$(uname -m)"
if [ "$system" != Darwin ] || [ "$machine" != arm64 ]; then
  echo "Recipe-Grams environment: NOT READY (unsupported host $system $machine)." >&2
  echo "Supported: Apple Silicon macOS (Darwin arm64). Nothing was checked or installed." >&2
  if [ "$system" = Darwin ] && [ "$(sysctl -in sysctl.proc_translated 2>/dev/null)" = 1 ]; then
    echo "This shell runs under Rosetta; open a native arm64 terminal and retry." >&2
  fi
  exit 1
fi

minimum_node="$(sed -n 's/^ *"node": *">=\([0-9][0-9.]*\)".*/\1/p' package.json)"

# Succeeds when version $1 is at least version $2 (both x.y.z).
version_at_least() {
  local IFS=.
  # shellcheck disable=SC2206
  local have=($1) need=($2)
  for i in 0 1 2; do
    if ((${have[i]:-0} != ${need[i]:-0})); then
      ((${have[i]:-0} > ${need[i]:-0}))
      return
    fi
  done
}

node_ready() {
  local version
  version="$(node -p process.versions.node 2>/dev/null)" || return 1
  version_at_least "$version" "$minimum_node"
}

bootstrap_node() {
  local nvm_dir="${NVM_DIR:-$HOME/.nvm}"
  if [ -s "$nvm_dir/nvm.sh" ]; then
    echo "Installing Node $(cat .nvmrc) with nvm (from .nvmrc)..."
    set +u
    # shellcheck disable=SC1091
    . "$nvm_dir/nvm.sh"
    nvm install
    nvm use >/dev/null
    set -u
    echo "Run 'nvm use' in your own shell to select this Node version."
  elif command -v brew >/dev/null 2>&1; then
    if brew list node >/dev/null 2>&1; then
      echo "Upgrading Homebrew's Node..."
      brew upgrade node
    else
      echo "Installing Node with Homebrew..."
      brew install node
    fi
  else
    cat >&2 <<EOF
Node $minimum_node or newer is required, and neither nvm nor Homebrew is available.
Install one of them, then rerun ./scripts/init.sh:
  - nvm: https://github.com/nvm-sh/nvm#installing-and-updating (per-user, no password)
  - Homebrew: https://brew.sh (asks for your administrator password)
Or install Node $(cat .nvmrc) from https://nodejs.org/.
EOF
    exit 1
  fi
}

if ! node_ready; then
  if [ "$mode" = check ]; then
    echo "Recipe-Grams environment: NOT READY (darwin-arm64)."
    if command -v node >/dev/null 2>&1; then
      echo "  wrong version Node $(node -p process.versions.node 2>/dev/null || echo unknown): package.json engines require >=$minimum_node"
    else
      echo "  missing       Node: package.json engines require >=$minimum_node"
    fi
    echo "Run ./scripts/init.sh to reconcile it."
    exit 1
  fi
  bootstrap_node
  if ! node_ready; then
    echo "Node $minimum_node or newer is still not the selected 'node'; select it and rerun." >&2
    exit 1
  fi
fi

exec node scripts/init-environment.mjs "$mode"
