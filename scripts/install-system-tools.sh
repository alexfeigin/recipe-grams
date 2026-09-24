#!/bin/bash
# Runs as root inside the macOS administrator prompt that scripts/init.sh opens,
# so one password approval covers both installs. Usage:
#   install-system-tools.sh <Command Line Tools git path> [Homebrew.pkg]
# Installs Apple's Command Line Tools the way Homebrew's own installer does,
# then the signed Homebrew package that init.sh downloaded and verified.
set -euo pipefail
# The administrator prompt already runs this with the system's default PATH.

clt_git="$1"
homebrew_pkg="${2-}"

if [ -n "$clt_git" ] && [ ! -x "$clt_git" ]; then
  # Software Update lists the Command Line Tools only while this file exists.
  placeholder=/tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress
  touch "$placeholder"
  trap 'rm -f "$placeholder"' EXIT
  label="$(softwareupdate -l 2>/dev/null |
    grep -B 1 -E 'Command Line Tools' |
    awk -F'*' '/^ *\*/ {print $2}' |
    sed -e 's/^ *Label: //' -e 's/^ *//' |
    sort -V | tail -n1 || true)"
  if [ -z "$label" ]; then
    echo "Software Update did not offer the Command Line Tools." >&2
    exit 3
  fi
  softwareupdate -i "$label"
  xcode-select --switch /Library/Developer/CommandLineTools
fi

if [ -n "$homebrew_pkg" ]; then
  installer -pkg "$homebrew_pkg" -target /
fi
