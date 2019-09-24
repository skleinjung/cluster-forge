import { createBuilder, createHandler } from '../../lib/modular-cli'
import { UpdateSealedSecretsKeyTask } from '../../lib/tasks/update-sealed-secrets-key'

const tasks = [
  new UpdateSealedSecretsKeyTask(),
]

exports.command = 'update-sealed-secrets-key <master-key>'
exports.describe = 'Updates the sealed-secrets master key used by a cluster.'
exports.builder = createBuilder(tasks)
exports.handler = createHandler(tasks)