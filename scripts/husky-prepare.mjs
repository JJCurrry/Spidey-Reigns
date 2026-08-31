// Husky 在 prepare 阶段会把 core.hooksPath 设成相对路径 `.husky/_`。
// 但本项目把真正的 git 数据（GIT_DIR）从工作树移到了工作树之外
// （桌面同级目录 Spidey-Reigns-gitdata，见 docs/ 环境坑笔记），
// 此时相对路径会以「外部 gitdir」为基准解析，指向错误位置，钩子会静默失效。
// 因此 husky 之后强制把 core.hooksPath 写成绝对路径（Windows 风格，git 原生可识别）。
import { execSync } from 'node:child_process';
import path from 'node:path';

const hooksPath = path.resolve(process.cwd(), '.husky/_').replace(/\\/g, '/');
execSync(`git config core.hooksPath "${hooksPath}"`, { stdio: 'inherit' });
console.log(`[husky-prepare] core.hooksPath = ${hooksPath}`);
