#!/usr/bin/env node

// 自定义前端启动脚本，禁用颜色输出
const { spawn } = require('child_process');
const process = require('process');

// 设置环境变量禁用颜色
process.env.NO_COLOR = '1';
process.env.FORCE_COLOR = '0';
process.env.CI = 'true';
process.env.NODE_NO_WARNINGS = '1';

// 启动 npm run serve
const child = spawn('npm', ['run', 'serve'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  env: process.env
});

// 过滤输出中的 ANSI 转义序列
function stripAnsi(str) {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}

// 处理标准输出
child.stdout.on('data', (data) => {
  const cleanData = stripAnsi(data.toString());
  process.stdout.write(cleanData);
});

// 处理错误输出
child.stderr.on('data', (data) => {
  const cleanData = stripAnsi(data.toString());
  process.stderr.write(cleanData);
});

// 处理子进程退出
child.on('close', (code) => {
  process.exit(code);
});

// 处理信号
process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
});
