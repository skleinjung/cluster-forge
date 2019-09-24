import { Arguments, Argv, CommandBuilder, CommandModule } from 'yargs'
import yargs from 'yargs'
import { each, identity, isNil, merge, reduce } from 'lodash'

import { Logging, logMultilineOutput } from '../logger'

import { ConfigurationOptions, AbstractTask } from './abstract-task'
export * from './abstract-task'

const log = Logging.getLogger('modular-cli')

export interface CommandError {
  message: string
  stack?: string
}

export const createBuilder = (tasks: AbstractTask[]): CommandBuilder => {
  const reducerFunction = (options: ConfigurationOptions, task: AbstractTask) => merge(options, task.getConfigurationOptions())
  return reduce(tasks, reducerFunction, {} as ConfigurationOptions)
}

export const createHandler = (tasks: AbstractTask[]) => async (args: Arguments) => {
  return reduce(tasks, (previousChain, currentTask) => {
    return previousChain
      .then((context: object) => {
        log.debug('Executing task: ', currentTask.constructor.name)
        log.debug('Context: ', JSON.stringify(context))

        return Promise.all([
          Promise.resolve(context),
          currentTask.execute(args, context),
        ])
      })
      .then(([originalContext, result]) => {
        if (result.result === 'error') {
          throw new Error('Failed executing task!')
        }
        return merge(originalContext, result.context)
      })
  }, Promise.resolve({}))
    .catch((error) => {
      if (error.message) {
        log.erronly('')
        log.erronly(error.message)
        log.erronly('')
      } else {
        log.erronly('Error executing command: ', error)
      }

      if (!isNil(error.stack)) {
        const stack = error.stack
        logMultilineOutput(stack, log.debug)
      }

      process.exit(-1)
    })
}

export interface YargsOptions {
  configureCallback?: (yargs: Argv) => Argv
  scriptName?: string
  usage?: string
  wrap?: number
}

export const configure = (commands: CommandModule[], {
  configureCallback = identity,
  scriptName = process.argv[1],
  usage = '$0 <command> [options]',
  wrap = Math.min(150, yargs.terminalWidth()),
}: YargsOptions) => {
  each(commands, (command) => yargs.command(command))

  return configureCallback(
    yargs
      .scriptName(scriptName)
      .usage(usage)
      .wrap(wrap)
      .demandCommand()
      .help()
      .fail((message: string, error: Error) => {
        yargs.showHelp()

        console.log('')
        log.error(message)
        console.log('')

        if (error) {
          throw error
        }
      })
  )
}

export const execute = (commands: CommandModule[], options: YargsOptions) => {
  try {
    configure(commands, options).parse()
  } catch (e) {
    log.error('Failed to execute command:', e)
  }
}