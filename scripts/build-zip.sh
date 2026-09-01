#!/usr/bin/env bash
# Build the distributable skill archive from the topolyn/ folder.
# Usage: scripts/build-zip.sh [output.zip]
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
out="${1:-$repo_root/topolyn.zip}"
if [[ "$out" != /* ]]; then
  out="$(pwd)/$out"
fi

# Runtime consumers support every Node version declared by topolyn/package.json,
# but canonical ZIP bytes depend on the Node/zlib toolchain. CI and releases use
# Node 22, so fail clearly instead of publishing different bytes from another
# Node major.
canonical_node_major=22
node_version="$(node -p 'process.versions.node')"
node_major="${node_version%%.*}"
if [[ "$node_major" != "$canonical_node_major" && "${TOPOLYN_ALLOW_NONCANONICAL_NODE:-0}" != "1" ]]; then
  echo "canonical topolyn.zip builds require Node $canonical_node_major (current: $node_version)" >&2
  exit 1
fi
if [[ "$node_major" != "$canonical_node_major" ]]; then
  echo "warning: building a local compatibility archive with Node $node_version; release archives still require Node $canonical_node_major" >&2
fi

# Stage only files tracked by Git. Paths and modes come from the index, while
# bytes intentionally come from the working tree so contributors can package
# tracked edits before committing them. A conflicted index is never publishable.
# Rejecting tracked paths that are symlinks prevents an archive build from
# reading through links to content outside the repository.
# test/ is repo-only (the golden harness compares against ../examples at the
# repo root, which does not exist in an installed skill). The npm scripts and
# build-only dependencies are stripped from the shipped package.json. Runtime
# schema validation is provided by the committed standalone validators, so
# installing the skill never requires npm install.
stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT
if [[ ! -f "$repo_root/topolyn/renderers/shared/generated-validators.mjs" ]]; then
  echo 'generated validators are missing — run npm run generate:validators in topolyn/' >&2
  exit 1
fi
# During an unstaged directory rename, Git still knows the package as
# `archify/`. Map that index identity onto the new Topolyn working-tree paths;
# after the rename is committed, the normal `topolyn/` path is used directly.
index_root=topolyn
if ! git -C "$repo_root" ls-files --error-unmatch topolyn/SKILL.md >/dev/null 2>&1; then
  index_root=archify
fi

while IFS= read -r -d '' record; do
  metadata="${record%%$'\t'*}"
  tracked="${record#*$'\t'}"
  package_path="topolyn/${tracked#*/}"
  if [[ "$package_path" == "topolyn/bin/archify.mjs" ]]; then
    package_path="topolyn/bin/topolyn.mjs"
  fi
  tracked_mode="${metadata%% *}"
  tracked_stage="${metadata##* }"
  if [[ "$tracked_stage" != 0 ]]; then
    echo "refusing to package unmerged index entry (stage $tracked_stage): $package_path" >&2
    exit 1
  fi
  case "$package_path" in
    topolyn/test | topolyn/test/* | \
    topolyn/package-lock.json | \
    topolyn/scripts/generate-brand-marks.mjs | \
    topolyn/scripts/generate-validators.mjs)
      continue
      ;;
  esac

  source="$repo_root/$package_path"
  if [[ -L "$source" ]]; then
    echo "refusing to package tracked symlink: $package_path" >&2
    exit 1
  fi
  if [[ ! -f "$source" ]]; then
    echo "tracked package input is missing or not a regular file: $package_path" >&2
    exit 1
  fi

  target="$stage/$package_path"
  mkdir -p "$(dirname "$target")"
  cp "$source" "$target"
  case "$tracked_mode" in
    100755) chmod 0755 "$target" ;;
    100644) chmod 0644 "$target" ;;
    *)
      echo "unsupported tracked package mode $tracked_mode: $package_path" >&2
      exit 1
      ;;
  esac
done < <(git -C "$repo_root" ls-files --stage -z -- "$index_root")

node -e "
  const fs = require('fs');
  const p = '$stage/topolyn/package.json';
  const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
  delete pkg.scripts;
  delete pkg.devDependencies;
  fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n');
"
rm -f "$stage/topolyn/package-lock.json"

node "$repo_root/scripts/write-deterministic-zip.mjs" "$stage/topolyn" "$out"

echo "built $out"
