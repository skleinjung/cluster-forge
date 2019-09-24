import { createBuilder, createHandler } from '../../lib/modular-cli'
import { DeployBlueprintTask, CreateBlueprintTask, GetGitContext } from '../../lib/tasks'

const tasks = [
  new GetGitContext(),
  new CreateBlueprintTask(),
  new DeployBlueprintTask(),
]

exports.command = 'bootstrap <name>'
exports.describe = 'Create a new blueprint, and use it to bootstrap a cluster.'
exports.builder = createBuilder(tasks)
exports.handler = createHandler(tasks)