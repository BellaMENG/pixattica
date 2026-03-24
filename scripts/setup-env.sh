#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
copied_count=0
skipped_count=0

while IFS= read -r example_file; do
    target_file="${example_file%.example}"

    if [[ -f "$target_file" ]]; then
        echo "skip  ${target_file#"$repo_root"/}"
        skipped_count=$((skipped_count + 1))
        continue
    fi

    cp "$example_file" "$target_file"
    echo "copy  ${target_file#"$repo_root"/}"
    copied_count=$((copied_count + 1))
done < <(
    find "$repo_root/apps" "$repo_root/packages" \
        \( -name ".env.example" -o -name ".dev.vars.example" \) \
        -type f \
        | sort
)

echo "done  copied=$copied_count skipped=$skipped_count"
