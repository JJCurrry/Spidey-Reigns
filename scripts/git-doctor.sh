#!/usr/bin/env sh
# 自检 relocated-git 设置是否健康。
GD="$(git rev-parse --git-dir 2>/dev/null)"
echo "pointer (.git) : $(cat .git 2>/dev/null || echo MISSING)"
echo "git-dir       : ${GD:-MISSING}"
case "$GD" in
  *".workbuddy/git-data/"*) echo "real gitdir   : safe haven (outside worktree root, OK)" ;;
  *"/.git")                  echo "real gitdir   : INSIDE worktree root .git (AT RISK of sandbox wipe)" ;;
  *)                        echo "real gitdir   : unusual location - verify" ;;
esac
echo "toplevel      : $(git rev-parse --show-toplevel 2>&1)"
echo "hooksPath     : $(git config --get core.hooksPath 2>&1)"
git fsck --full >/dev/null 2>&1 && echo "repo health   : healthy" || echo "repo health   : CORRUPT"
