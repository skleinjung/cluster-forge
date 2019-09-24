#!/usr/bin/env ts-node

import * as path from 'path'

import { execute } from '../lib/modular-cli'

// add locallly-installed node commands to the path
process.env.PATH += (path.delimiter + path.join(__dirname, 'node_modules', '.bin'))

try {
  execute([
    require('../commands/cforge/bootstrap.command'),
    require('../commands/cforge/create-blueprint.command'),
    require('../commands/cforge/deploy-blueprint.command'),
    require('../commands/cforge/update-sealed-secrets-key.command'),
  ], { scriptName: 'scripts/cforge' })
} catch (e) {
  console.error('Failed to execute command:', e)
}

