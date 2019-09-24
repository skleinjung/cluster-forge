#!/usr/bin/env ts-node

import * as path from 'path'

import { cli } from './lib/modular-cli'
import { Logging } from './lib/logger'
import CreateSealedSecretsTask from './lib/tasks/create-sealed-secrets'
import CreateFluxMasterTask from './lib/tasks/create-flux-master'
import CreateNamespaceTask from './lib/tasks/create-namespace'

const scriptName = path.basename(process.argv[1])

// add locallly-installed node commands to the path
process.env.PATH += (path.delimiter + path.join(__dirname, 'node_modules', '.bin'))

const commandTasks = {
  bootstrap: [new CreateSealedSecretsTask(), new CreateFluxMasterTask()],
  createNamespace: [new CreateNamespaceTask()],
}

try {
  cli
    .withYargs((yargs) => { yargs.scriptName(`scripts/${scriptName}`) })
    .command('bootstrap', 'bootstrap a new cluster', commandTasks.bootstrap)
    .command('create-namespace', 'adds a namespace to a blueprint', commandTasks.createNamespace)
    .execute()
} catch (e) {
  const log = Logging.getLogger('CLI')
  log.error('Failed to execute command:', e)
}

