import yargs, { Arguments, Argv, Options } from 'yargs'
import { flow, map, merge, reduce } from 'lodash'

export type ConfigurationOptions<T extends {} = {}> = { [key in keyof T]: Options }

export type ResultCode = 'success' | 'error'
export interface Result<T extends {} = any> {
  code: ResultCode
  context?: T
}

export interface Task<C extends {} = {}, I extends {} = {}, O extends {} = {}> {
  getConfigurationOptions: () => ConfigurationOptions<C>
  execute: (configuration: C, context?: I) => Promise<Result<O>>
}

export interface CliConfiguration {
  withYargs: (yargsHandler: (yargs: Argv) => void) => CliConfiguration
  command: (name: string, description: string, tasks: Array<Task<any, any, any>>) => CliConfiguration
  execute: () => void
}

class CliConfigurationImpl implements CliConfiguration {
  private yargs: Argv

  constructor() {
    this.yargs = yargs
  }

  withYargs = (yargsHandler: (yargs: yargs.Argv) => void) => {
    yargsHandler(this.yargs)
    return this
  }

  command = (name: string, description: string, tasks: Array<Task<any, any, any>>) => {
    this.yargs.command(name, description, this.createOptions(tasks), this.runTasks(tasks))
    return this
  }

  execute = () => {
    this.yargs
      .demandCommand()
      .wrap(Math.min(150, this.yargs.terminalWidth()))
      .parse()
  }

  private createOptions = (tasks: Array<Task>) => {
    const reducerFunction = (options: ConfigurationOptions, task: Task) => merge(options, task.getConfigurationOptions())
    return reduce(tasks, reducerFunction, {} as ConfigurationOptions)
  }

  private runTasks = (tasks: Array<Task>) => (args: Arguments) => {
    flow(map(tasks, (task) => async (context) => {
      const result = await task.execute(args, context)
      return merge(context, result.context)
    }))({})
  }
}

export const error = <T>(outputContext: T) => ({ code: 'error', context: outputContext })
export const success = <T>(outputContext: T) => ({ code: 'success', context: outputContext })

export const cli = new CliConfigurationImpl()