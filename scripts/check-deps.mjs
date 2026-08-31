// 一次性体检脚本：扫描 node_modules 里 main 入口文件缺失的损坏包。
// 用途：安装过程被中断/清理后，快速定位「装了但文件不全」的包。
// 用法：node scripts/check-deps.mjs
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = 'node_modules';
const broken = [];
const dirs = [];

for (const name of readdirSync(root)) {
  if (name === '.bin') continue;
  if (name.startsWith('@')) {
    for (const sub of readdirSync(join(root, name))) dirs.push(join(root, name, sub));
  } else {
    dirs.push(join(root, name));
  }
}

for (const dir of dirs) {
  const pkgPath = join(dir, 'package.json');
  if (!existsSync(pkgPath)) continue;
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  } catch {
    continue;
  }
  const main = pkg.main;
  if (typeof main !== 'string') continue;
  // 无扩展名的入口（如 "index" / "dist/lib/index"）由 Node 补 .js 解析，不算损坏
  const candidates = /\.[a-z]+$/i.test(main)
    ? [join(dir, main)]
    : [join(dir, main), join(dir, main + '.js'), join(dir, main, 'index.js')];
  if (!candidates.some((candidate) => existsSync(candidate))) {
    broken.push(pkg.name + ' -> 缺失 ' + main);
  }
}

console.log('检查了 ' + dirs.length + ' 个包，损坏 ' + broken.length + ' 个：');
for (const line of broken) console.log('  ' + line);
