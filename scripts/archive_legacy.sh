#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR"

ARCHIVE_DIR=legacy
DATE_TAG=$(date +%F)
TAG_NAME="pre-rebuild-$DATE_TAG"

mkdir -p "$ARCHIVE_DIR"

for d in client server; do
  if [ -d "$d" ]; then
    echo "Archiving $d -> $ARCHIVE_DIR/$d"
    git mv "$d" "$ARCHIVE_DIR/"
  else
    echo "Directory $d not found, skipping"
  fi
done

git add .
git commit -m "chore: archive legacy client and server before rebuild ($DATE_TAG)" || true
git tag -f "$TAG_NAME"
echo "Created tag: $TAG_NAME"

echo "Done. Review changes and push the branch and tag when ready."
