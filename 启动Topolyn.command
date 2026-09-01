#!/bin/bash

# Topolyn macOS one-click website launcher.

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SITE_ENTRY="$SCRIPT_DIR/docs/index.html"
SITE_SERVER="$SCRIPT_DIR/scripts/serve-topolyn-site.mjs"

if [ -t 1 ]; then
  clear
fi

printf '\n========================================\n'
printf '          Topolyn 官网启动器\n'
printf '========================================\n\n'

pause_before_exit() {
  if [ -t 0 ]; then
    printf '\n按回车键关闭此窗口...'
    read -r _
  fi
}

fail() {
  printf '\n[启动失败] %s\n' "$1"
  pause_before_exit
  exit 1
}

[ -f "$SITE_ENTRY" ] || fail "未找到官网首页：$SITE_ENTRY"
[ -f "$SITE_SERVER" ] || fail "未找到官网启动程序：$SITE_SERVER"
command -v node >/dev/null 2>&1 || fail "未安装 Node.js（需要 18 或更高版本）。"

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null)"
case "$NODE_MAJOR" in
  ''|*[!0-9]*) fail "无法识别 Node.js 版本。" ;;
esac
[ "$NODE_MAJOR" -ge 18 ] || fail "Node.js 版本过低，需要 18 或更高版本。"

printf '正在打开 Topolyn 完整官网…\n'
printf '启动后可浏览首页、聊天式工作台、场景指南和验证作品集。\n'
printf '要关闭本地网站，请回到此窗口按 Ctrl+C。\n\n'

node "$SITE_SERVER"
STATUS=$?

if [ "$STATUS" -eq 0 ] || [ "$STATUS" -eq 130 ]; then
  printf '\nTopolyn 官网已关闭。\n'
else
  printf '\nTopolyn 官网启动器已退出（状态码：%s）。\n' "$STATUS"
fi

pause_before_exit
exit "$STATUS"
