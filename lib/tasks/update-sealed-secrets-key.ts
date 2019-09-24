import { each, trim } from 'lodash'
import chalk from 'chalk'

import { ConfigurationOptions } from '../modular-cli'
import { createKubectl, Pod } from '../kubernetes'
import { Logger, Logging } from '../logger'
import { Result, AbstractTask } from '../modular-cli'

import {
  GlobalKubernetesConfiguration,
  GlobalKubernetesConfigurationOptions,
} from './config/global-kubernetes-configuration'

type UpdateSealedSecretsKeyConfiguration = GlobalKubernetesConfiguration & {
  masterKey?: string
}

export class UpdateSealedSecretsKeyTask extends AbstractTask<UpdateSealedSecretsKeyConfiguration> {
  private log: Logger = Logging.getLogger('apply-blueprint')

  getConfigurationOptions(): ConfigurationOptions<UpdateSealedSecretsKeyConfiguration> {
    const optionGroup = 'SealedSecrets Options:'
    return {
      ...GlobalKubernetesConfigurationOptions(),
      masterKey: {
        group: optionGroup,
        description: 'path to the cluster\'s SealedSecrets master key',
        defaultDescription: 'a new master key will be generated',
        type: 'string',
      },
    }
  }

  async execute({ masterKey, ...kubectlConfig }: UpdateSealedSecretsKeyConfiguration) : Promise<Result> {
    const kubectl = createKubectl()
    const trimmedMasterKey = trim(masterKey)

    return Promise.resolve()
      .then(() => {
        return trimmedMasterKey !== ''
          ? kubectl.deploy({
            command: 'create',
            kustomize: false,
            path: trimmedMasterKey,
          }) : {}
      })
      .then(() => {
        if (trimmedMasterKey !== '') {
          each(kubectl.getDeploymentPods('sealed-secrets-controller', 'bootstrap'), (pod: Pod) => {
            this.log.info('Restarting SealedSecrets controller pod: ', pod.metadata.name)
          })
        } else {
          this.log.info(chalk.bold('*********************************************************************************************************'))
          this.log.info(chalk.bold('* To access the kubeseal master keys:                                                                   *'))
          this.log.info(chalk.bold('* `kubectl get secret --all-namespaces --selector=sealedsecrets.bitnami.com/sealed-secrets-key -o yaml` *'))
          this.log.info(chalk.bold('*********************************************************************************************************'))
        }
        return this.success()
      })
      .catch((err) => {
        this.log.error('SealedSecrets key deployment failed: ', err)
        return this.error()
      })
  }
}