#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
}

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset)
}

// Check if node_modules exists
const fs = require('fs')
if (!fs.existsSync('node_modules')) {
  log('📦 Installing dependencies...', 'yellow')
  const install = spawn('npm', ['install'], { stdio: 'inherit' })
  
  install.on('close', (code) => {
    if (code === 0) {
      startServer()
    } else {
      log('❌ Failed to install dependencies', 'red')
      process.exit(1)
    }
  })
} else {
  startServer()
}