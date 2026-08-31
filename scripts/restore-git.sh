#!/usr/bin/env sh
# 沙箱清理偶尔会删掉工作树里的 .git 指针文件（一个普通文件）。
# 真正的 git 历史在 .workbuddy/git-data/spidey-reigns-git（平台承诺不清的目录），不会丢。
# 本脚本只重建那个一行指针文件，让仓库瞬间恢复。
set -e

GITDIR_GIT="C:/Users/Administrator/Desktop/Spidey-Reigns/.workbuddy/git-data/spidey-reigns-git"

# 直接写回指针，再用 git 自身（它能正确解析指针路径）校验数据是否还在。
printf 'gitdir: %s\n' "$GITDIR_GIT" > .git
if git fsck --full >/dev/null 2>&1; then
  echo "OK: .git 指针已恢复，仓库健康。"
  git log --oneline -1
else
  echo "WARN: 指针已恢复，但仓库报告错误；请用桌面 bundle 恢复：" >&2
  echo "  git fetch 'C:/Users/Administrator/Desktop/Spidey-Reigns-gitbackup.bundle' main" >&2
  echo "  git reset --mixed main" >&2
  exit 1
fi
