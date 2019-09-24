import { createBuilder, createHandler } from '../../lib/modular-cli'
import { DeployBlueprintTask } from '../../lib/tasks'

const tasks = [
  new DeployBlueprintTask(),
]

exports.command = 'deploy-blueprint <name>'
exports.describe = 'Deploys a named blueprint to a cluster.'
exports.builder = createBuilder(tasks)
exports.handler = createHandler(tasks)