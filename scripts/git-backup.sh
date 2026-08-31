#!/usr/bin/env sh
# 把完整历史打成离线 bundle，存到桌面（工作树之外，沙箱清理够不到的地方）。
# 直接写绝对路径会踩 git bundle 的 .lock 怪癖，所以先在仓库内生成再 mv。
set -e

cd "$(git rev-parse --show-toplevel)"
BUNDLE_DEST="/c/Users/Administrator/Desktop/Spidey-Reigns-gitbackup.bundle"
TMP="./_git_backup_tmp.bundle"

git bundle create "$TMP" --all
git bundle verify "$TMP" >/dev/null
mv -f "$TMP" "$BUNDLE_DEST"
echo "Backup written: $BUNDLE_DEST"
