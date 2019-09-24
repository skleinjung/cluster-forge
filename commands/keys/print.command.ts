import { createBuilder, createHandler } from '../../lib/modular-cli'
import { GetSealedSecretsKeysTask } from '../../lib/tasks'

const tasks = [
  new GetSealedSecretsKeysTask(),
]

exports.command = 'print'
exports.describe = 'Dump metadata about SealedSecrets to stdout.'
exports.builder = createBuilder(tasks)
exports.handler = createHandler(tasks)