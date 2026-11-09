#!/bin/sh
# Stamp a version (?v=YYYYMMDDHHMM) on all local CSS/JS links in the pages.
# GitHub Pages lets browsers cache files for 10 minutes; without a version a visitor
# can get new HTML with old scripts right after a deploy. Run this before every push:
#   sh scripts/stamp-version.sh
# (macOS sed syntax: -i '')

cd "$(dirname "$0")/.." || exit 1
v=$(date +%Y%m%d%H%M)

for f in index.html theory/*.html games/*.html; do
  sed -E -i '' "s#((src|href)=\"(\.\./)?(js|css)/[A-Za-z0-9_-]+\.(js|css))(\?v=[0-9]+)?\"#\1?v=$v\"#g" "$f"
done

echo "Stamped version $v"
