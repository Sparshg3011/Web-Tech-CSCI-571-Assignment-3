'use strict';

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const backendDir = path.resolve(__dirname, '..');
const frontendDir = path.resolve(backendDir, '../frontend');
const frontendDistDir = path.resolve(frontendDir, 'dist');
const targetDir = path.resolve(backendDir, 'public');

const runCommand = (command, cwd) => {
  execSync(command, {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });
};

if (!fs.existsSync(frontendDir)) {
  console.warn('⚠️  Frontend directory not found. Skipping frontend build step.');
  process.exit(0);
}

const frontendNodeModules = path.resolve(frontendDir, 'node_modules');
if (!fs.existsSync(frontendNodeModules)) {
  console.log('📦 Installing frontend dependencies...');
  runCommand('npm install', frontendDir);
}

console.log('🛠️  Building frontend bundle...');
runCommand('npm run build', frontendDir);

if (!fs.existsSync(frontendDistDir)) {
  console.warn('⚠️  Frontend build output not found. Skipping asset copy.');
  process.exit(0);
}

if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}

console.log('📁 Copying frontend build into backend/public ...');
fs.cpSync(frontendDistDir, targetDir, { recursive: true });

console.log('✅ Frontend assets prepared at:', targetDir);


