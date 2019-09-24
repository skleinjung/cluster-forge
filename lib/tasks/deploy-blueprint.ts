import * as path from 'path'

import chalk from 'chalk'

import { ConfigurationOptions } from '../modular-cli'
import { createKubectl, createKubernetesLogger } from '../kubernetes'
import { Logger, Logging } from '../logger'
import { Result, AbstractTask } from '../modular-cli'

import {
  GlobalKubernetesConfiguration,
  GlobalKubernetesConfigurationOptions,
} from './config/global-kubernetes-configuration'
import {
  GlobalBlueprintConfiguration,
  GlobalBlueprintConfigurationOptions,
} from './config/global-blueprint-configuration'

type ApplyBlueprintConfiguration = GlobalKubernetesConfiguration & GlobalBlueprintConfiguration & {
  masterKey?: string
}

export class DeployBlueprintTask extends AbstractTask<ApplyBlueprintConfiguration> {
  private log: Logger = Logging.getLogger('deploy-blueprint')

  getConfigurationOptions(): ConfigurationOptions<ApplyBlueprintConfiguration> {
    const optionGroup = 'SealedSecrets Options:'
    return {
      ...GlobalBlueprintConfigurationOptions(),
      ...GlobalKubernetesConfigurationOptions(),
      masterKey: {
        group: optionGroup,
        description: 'path to the cluster\'s SealedSecrets master key',
        defaultDescription: 'a new master key will be generated',
        type: 'string',
      },
    }
  }

  async execute({ name, blueprintRoot, waitTimeout, ...kubectlConfig }: ApplyBlueprintConfiguration) : Promise<Result> {
    const kubectl = createKubectl()
    const kubernetesLogger = createKubernetesLogger(kubectl)
    const blueprintPath = path.join(blueprintRoot, name)
    const trimmedMasterKey = ''

    return Promise.resolve()
      .then(() => {
        // return trimmedMasterKey !== ''
        //   ? kubectl.deploy({ path: trimmedMasterKey })
        //   : {}
        {}
      })
      .then(() => kubectl.apply({ kustomization: path.join(blueprintPath, 'bootstrap') }))
      .then(() => kubectl.wait({
        ...kubectlConfig,
        kind: 'deployment',
        labelSelector: 'app.kubernetes.io/managed-by: cforge',
        namespace: 'bootstrap',
        timeout: waitTimeout,
      }))
      .then(() => {
        if (trimmedMasterKey === '') {
          this.log.info(chalk.bold('*********************************************************************************************************'))
          this.log.info(chalk.bold('* To access the kubeseal master keys:                                                                   *'))
          this.log.info(chalk.bold('* `kubectl get secret --all-namespaces --selector=sealedsecrets.bitnami.com/sealed-secrets-key -o yaml` *'))
          this.log.info(chalk.bold('*********************************************************************************************************'))
        }
        return this.success()
      })
      .catch((err) => {
        this.log.error('Deployment failed: ', err)
        kubernetesLogger.logDeploymentState('sealed-secrets-controller', 'bootstrap')
        kubernetesLogger.logDeploymentState('flux-bootstrap', 'bootstrap')
        return this.error()
      })
  }
}