#!/bin/sh

set -eu

src=${1:-}
dst=${2:-}

if [ -z "$src" ] || [ -z "$dst" ] || [ ! -d "$src" ] || [ ! -d "$dst" ] || [ "$src" = "$dst" ]; then
  exit 0
fi

cd "$src"

# Tracked .env files are already present after checkout; only copy local overrides.
find . -type f -name '.env*' | while IFS= read -r relpath; do
  rel=${relpath#./}

  if git ls-files --error-unmatch -- "$rel" >/dev/null 2>&1; then
    continue
  fi

  target="$dst/$rel"
  if [ -e "$target" ]; then
    continue
  fi

  mkdir -p "$(dirname "$target")"
  cp -p "$rel" "$target"
done
