#!/usr/bin/env ts-node

import * as path from 'path'

import { execute } from '../lib/modular-cli'

// add locallly-installed node commands to the path
process.env.PATH += (path.delimiter + path.join(__dirname, 'node_modules', '.bin'))

try {
  execute([
    require('../commands/keys/print.command'),
  ], { scriptName: 'scripts/keys' })
} catch (e) {
  console.error('Failed to execute command:', e)
}

