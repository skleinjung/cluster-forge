import * as path from 'path'

import { config, env, exec } from 'shelljs'
import { trim } from 'lodash'
import chalk from 'chalk'

import { ConfigurationOptions, Task, Result } from '../modular-cli'
import { createKubectl,createKubernetesLogger } from '../kubernetes'
import { Logger, Logging } from '../logger'

import { BootstrapGlobalConfiguration, BootstrapGlobalConfigurationOptions } from './bootstrap-global-configuration'

config.fatal = true
env['FORCE_COLOR'] = '0'

interface CreateSealedSecretsConfiguration extends BootstrapGlobalConfiguration {
  kubesealMasterKey?: string
}

export default class CreateSealedSecretsTask implements Task<CreateSealedSecretsConfiguration> {
  private log: Logger = Logging.getLogger('create-sealed-secrets')

  getConfigurationOptions(): ConfigurationOptions<CreateSealedSecretsConfiguration> {
    const optionGroup = 'SealedSecrets Controller:'
    return {
      ...BootstrapGlobalConfigurationOptions(),
      kubesealMasterKey: {
        group: optionGroup,
        description: 'path to the cluster\'s kubeseal master key',
        defaultDescription: 'a new master key will be generated',
        type: 'string',
      },
    }
  }

  async execute({ kubesealMasterKey, kustomizationRoot, name, blueprintRoot }: CreateSealedSecretsConfiguration) : Promise<Result> {
    const kubectl = createKubectl()
    const kubernetesLogger = createKubernetesLogger(kubectl)
    const blueprintPath = path.join(blueprintRoot, name)

    if (trim(kubesealMasterKey) !== '') {
      kubectl.deploy({ path: trim(kubesealMasterKey) })
    }

    const command =
      'hygen bootstrap sealed-secrets' +
        ` --name "${name}"` +
        ` --blueprintRoot "${blueprintRoot}"` +
        ` --kustomizationRoot="${kustomizationRoot}"`

    this.runShellCommand(command)
    kubectl.deploy({
      kustomize: true,
      path: blueprintPath,
      waitConfigs: [{
        target: {
          kind: 'deployment',
          namespace: 'kube-system',
          name: 'sealed-secrets-controller',
        },
        timeout: 180,
        timeoutCallback: () => kubernetesLogger.logDeploymentState('sealed-secrets-controller', 'kube-system'),
      }],
    })

    if (trim(kubesealMasterKey) === '') {
      this.log.info(chalk.bgRed.white('To access the kubeseal master key: `kubectl get secret -n kube-system sealed-secrets-key -o yaml`'))
    }

    return { code: 'success' }
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