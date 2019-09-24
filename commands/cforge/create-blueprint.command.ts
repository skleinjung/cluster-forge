import { createBuilder, createHandler } from '../../lib/modular-cli'
import { CreateBlueprintTask, GetGitContext } from '../../lib/tasks'

const tasks = [
  new GetGitContext(),
  new CreateBlueprintTask(),
]

exports.command = 'create-blueprint <name>'
exports.describe = 'Create a new blueprint.'
exports.builder = createBuilder(tasks)
exports.handler = createHandler(tasks)