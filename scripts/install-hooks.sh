#!/usr/bin/env sh
set -e

git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
echo "hooks-installed: core.hooksPath=.githooks"
