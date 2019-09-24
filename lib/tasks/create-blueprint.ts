import { config, env, exec } from 'shelljs'

import { ConfigurationOptions } from '../modular-cli'
import { Logger, Logging } from '../logger'
import { Result, AbstractTask } from '../modular-cli'

import {
  GlobalBlueprintConfiguration,
  GlobalBlueprintConfigurationOptions,
} from './config/global-blueprint-configuration'
import { GitContext } from './get-git-context'

config.fatal = true
env['FORCE_COLOR'] = '0'

interface CreateBlueprintConfiguration extends GlobalBlueprintConfiguration { }

export class CreateBlueprintTask extends AbstractTask<CreateBlueprintConfiguration, GitContext> {
  private log: Logger = Logging.getLogger('create-blueprint')

  getConfigurationOptions(): ConfigurationOptions<CreateBlueprintConfiguration> {
    return { ...GlobalBlueprintConfigurationOptions() }
  }

  async execute(
    { kustomizationRoot, name, blueprintRoot }: CreateBlueprintConfiguration,
    { git }: GitContext
  ) : Promise<Result> {
    const { url: gitUrl, branch: gitBranch } = git

    return Promise.resolve()
      .then(() => {
        const command =
          'hygen blueprint create' +
          ` --name "${name}"` +
          ` --blueprintRoot "${blueprintRoot}"` +
          ` --kustomizationRoot="${kustomizationRoot}"` +
          ` --gitUrl "${gitUrl}"` +
          ` --gitBranch "${gitBranch}"`

        this.runShellCommand(command)
        return this.success()
      })
  }

  private runShellCommand = (command: string) => {
    this.log.debug(`Executing: ${command}`)
    const result = exec(command, { silent: true })
    this.log.execResults(result)
    if (result.code !== 0) {
      throw new Error('Command execution failed. See above output.')
    }
  }
}