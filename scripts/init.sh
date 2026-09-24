#!/usr/bin/env bash
# Recipe-Grams development environment: one entry point for checking, setting
# up, and upgrading the baseline declared in dev-environment.json. Agents run it
# on the user's behalf; the only human step is macOS's own password window.
# See docs/development.md#development-environment.
set -euo pipefail

usage="Usage: ./scripts/init.sh [--check | --audit | --upgrade]
  (no option)  install missing requirements, then check readiness
  --check      read-only, offline readiness check; run it before each task
  --audit      optional offline comparison with the pinned UI design skill
  --upgrade    upgrade installed tools that do not meet engines, move
               managed external skills to their newest upstream releases, and
               record the resolved versions in dev-environment.json
Normal setup accepts any installed version and never probes GitHub access."

mode=setup
case "${1-}" in
"") ;;
--check) mode=check ;;
--audit) mode=audit ;;
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

fail() {
  printf '%s\n' "$*" >&2
  exit 1
}

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

declared() {
  plutil -extract "$1" raw -o - dev-environment.json
}

# The overrides exist for scripts/dev-environment.test.mjs.
homebrew_prefix="${RECIPE_GRAMS_HOMEBREW_PREFIX:-$(declared system.homebrew.prefix)}"
clt_git="${RECIPE_GRAMS_CLT_GIT:-$(declared system.commandLineTools)}"
cache_dir="${RECIPE_GRAMS_CACHE:-$HOME/Library/Caches/recipe-grams}"
minimum_node="$(sed -n 's/^ *"node": *">=\([0-9][0-9.]*\)".*/\1/p' package.json)"
caller_path="$PATH"

has_command_line_tools() { [ -x "$clt_git" ]; }
has_homebrew() { [ -x "$homebrew_prefix/bin/brew" ]; }
use_homebrew() { PATH="$homebrew_prefix/bin:$homebrew_prefix/sbin:$PATH"; }
has_git() {
  has_command_line_tools || {
    local selected
    selected="$(command -v git || true)"
    [ -n "$selected" ] && [ "$selected" != /usr/bin/git ]
  }
}
node_present() { node -p process.versions.node >/dev/null 2>&1; }

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

# Check mode without a usable Node: report what setup would install.
report_bootstrap_gaps() {
  echo "Recipe-Grams environment: NOT READY (darwin-arm64)."
  has_git || echo "  missing       Git: no usable git executable was found"
  command -v gh >/dev/null 2>&1 || echo "  missing       GitHub CLI: gh is not on PATH"
  node_present || echo "  missing       Node: node is not on PATH"
  command -v npm >/dev/null 2>&1 || echo "  missing       npm: npm is not on PATH"
  echo "Run ./scripts/init.sh to install what is missing."
}

# Runs a shell command as root through macOS's own password window.
run_as_administrator() {
  osascript \
    -e 'on run argv' \
    -e 'do shell script (item 1 of argv) with prompt (item 2 of argv) with administrator privileges' \
    -e 'end run' \
    "$1" "$2" 2>&1
}

download_homebrew_installer() {
  local url team pkg signature
  url="$(declared system.homebrew.installer)"
  team="$(declared system.homebrew.signerTeamId)"
  pkg="$cache_dir/homebrew/Homebrew.pkg"
  mkdir -p "$cache_dir/homebrew"
  echo "Downloading Homebrew's installer from $url ..." >&2
  curl -fsSL --retry 2 -o "$pkg.part" "$url" ||
    fail "Could not download Homebrew's installer. Check the internet connection and run setup again."
  signature="$(pkgutil --check-signature "$pkg.part" 2>&1 || true)"
  if ! grep -qF "Status: signed by a developer certificate issued by Apple for distribution" <<<"$signature" ||
    ! grep -qF "Notarization: trusted by the Apple notary service" <<<"$signature" ||
    ! grep -qF "Developer ID Installer:" <<<"$signature" ||
    ! grep -qF "($team)" <<<"$signature"; then
    rm -f "$pkg.part"
    fail "Homebrew's installer is not signed and notarized by the expected developer ($team), so nothing was installed."
  fi
  mv "$pkg.part" "$pkg"
  printf '%s\n' "$pkg"
}

# Apple's own "Install" window, for when Software Update cannot install the
# Command Line Tools unattended.
install_command_line_tools_with_apple_window() {
  echo "Opening Apple's installer for the Command Line Tools. In its window, click Install and accept the license; it can take 10 to 20 minutes."
  xcode-select --install >/dev/null 2>&1 || true
  local waited=0
  until has_command_line_tools; do
    [ "$waited" -lt 3600 ] ||
      fail "The Command Line Tools were not installed within an hour. Finish Apple's installer window, then run setup again."
    sleep 15
    waited=$((waited + 15))
  done
}

# Installs Apple's Command Line Tools and Homebrew behind one password window.
install_system_tools() {
  local pkg="" what command output minimum macos requested_clt=""
  if ! has_command_line_tools && { [ "$need_homebrew" = true ] || ! has_git; }; then
    requested_clt="$clt_git"
  fi
  if [ "$need_homebrew" = true ] && ! has_homebrew; then
    minimum="$(declared system.homebrew.minimumMacOS)"
    macos="$(sw_vers -productVersion)"
    [ "${macos%%.*}" -ge "$minimum" ] ||
      fail "Homebrew's installer needs macOS $minimum or newer, and this Mac has macOS $macos. Update macOS in System Settings > General > Software Update, then run setup again."
    pkg="$(download_homebrew_installer)"
  fi
  if [ -z "$requested_clt" ]; then
    what="Homebrew"
  elif [ -n "$pkg" ]; then
    what="Apple's Command Line Tools and Homebrew"
  else
    what="Apple's Command Line Tools"
  fi
  echo "Installing $what. macOS will show a password window; this can take 10 to 20 minutes."
  command="/bin/bash $(printf %q "$root/scripts/install-system-tools.sh") $(printf %q "$requested_clt") $(printf %q "$pkg")"
  if ! output="$(run_as_administrator "$command" "Recipe-Grams setup wants to install $what. Enter the password you use to log in to this Mac.")"; then
    case "$output" in
    *"(-128)"*)
      fail "The password window was closed, so $what was not installed. Run setup again when you are ready to approve it."
      ;;
    *"did not offer the Command Line Tools"*)
      install_command_line_tools_with_apple_window
      if [ "$need_homebrew" = true ] && ! has_homebrew; then install_system_tools; fi
      return
      ;;
    *)
      fail "Installing $what did not finish. A person signed in at this Mac has to approve the password window. Details: $output"
      ;;
    esac
  fi
  has_git || fail "Git is still missing after installation."
  if [ "$need_homebrew" = true ]; then
    has_command_line_tools || fail "The Command Line Tools are still missing after installation."
    has_homebrew || fail "Homebrew is still missing after installation."
  fi
}

# Setup does not upgrade tools already on this Mac: Homebrew must not update
# itself, and an install that would also upgrade installed Homebrew packages is
# refused. --upgrade lifts both.
refuse_homebrew_upgrades() {
  local outdated dependency affected=""
  outdated="$(brew outdated --formula --quiet 2>/dev/null || true)"
  [ -n "$outdated" ] || return 0
  for dependency in $(brew deps --formula "$1" 2>/dev/null || true); do
    if grep -qFx "$dependency" <<<"$outdated"; then
      affected="$affected $dependency"
    fi
  done
  [ -z "$affected" ] ||
    fail "Installing $1 with Homebrew would also upgrade these installed Homebrew packages:$affected. Setup does not upgrade tools already on this Mac; ./scripts/init.sh --upgrade allows it."
}

# Setup installs a missing Node; only upgrade replaces an old one.
provide_node() {
  local nvm_dir="${NVM_DIR:-$HOME/.nvm}"
  if [ -s "$nvm_dir/nvm.sh" ]; then
    echo "Installing Node $(cat .nvmrc) with nvm (from .nvmrc)..."
    set +u
    # shellcheck disable=SC1091
    . "$nvm_dir/nvm.sh"
    nvm install
    nvm use >/dev/null
    set -u
  elif brew list node >/dev/null 2>&1; then
    [ "$mode" = upgrade ] ||
      fail "Homebrew's Node is installed but not linked, so it is not selected. Run brew link node, then run setup again."
    echo "Upgrading Node with Homebrew..."
    NONINTERACTIVE=1 brew upgrade node
  else
    [ "$mode" = upgrade ] || refuse_homebrew_upgrades node
    echo "Installing Node with Homebrew..."
    NONINTERACTIVE=1 brew install node
  fi
}

if [ "$mode" = check ] || [ "$mode" = audit ]; then
  if ! node_present && [ -x "$homebrew_prefix/bin/node" ]; then
    # Installed, but this session started before Homebrew joined the PATH.
    use_homebrew
  fi
  if ! node_present; then
    report_bootstrap_gaps
    exit 1
  fi
else
  need_homebrew=false
  if ! has_homebrew && {
    ! command -v gh >/dev/null 2>&1 ||
      { ! node_present && [ ! -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; } ||
      ! command -v npm >/dev/null 2>&1
  }; then
    need_homebrew=true
  fi
  if ! has_git || [ "$need_homebrew" = true ]; then
    install_system_tools
  fi
  if has_homebrew; then use_homebrew; fi
  [ "$mode" = upgrade ] || export HOMEBREW_NO_AUTO_UPDATE=1
  if ! node_present || { [ "$mode" = upgrade ] && ! node_ready; }; then
    provide_node
    node_present || fail "Node is still not available on PATH after installation."
  fi
  if ! command -v npm >/dev/null 2>&1; then
    if has_homebrew && brew list node >/dev/null 2>&1; then
      [ "$mode" = upgrade ] || refuse_homebrew_upgrades node
      NONINTERACTIVE=1 brew reinstall node
    elif has_homebrew; then
      [ "$mode" = upgrade ] || refuse_homebrew_upgrades node
      NONINTERACTIVE=1 brew install node
    else
      fail "npm is missing. Install it with the existing Node distribution, then run setup again."
    fi
    command -v npm >/dev/null 2>&1 || fail "npm is still missing after installing Node."
  fi
  if ! command -v gh >/dev/null 2>&1; then
    [ "$mode" = upgrade ] || refuse_homebrew_upgrades gh
    NONINTERACTIVE=1 brew install gh
  fi
fi

RECIPE_GRAMS_CALLER_PATH="$caller_path" exec node scripts/init-environment.mjs "$mode"
