import { AbstractTask, ConfigurationOptions, Result } from '../modular-cli'
import { createKubectl } from '../kubernetes'
import { Logger, Logging } from '../logger'

import {
  GlobalKubernetesConfiguration,
  GlobalKubernetesConfigurationOptions,
} from './config/global-kubernetes-configuration'

export type GetSealedSecretsKeyConfiguration = GlobalKubernetesConfiguration & {
  includeActive?: boolean
  includeInactive?: boolean
}

export class GetSealedSecretsKeysTask extends AbstractTask<GetSealedSecretsKeyConfiguration> {
  private log: Logger = Logging.getLogger('get-sealed-secrets')

  getConfigurationOptions(): ConfigurationOptions<GetSealedSecretsKeyConfiguration> {
    const optionGroup = 'SealedSecret Keys Options:'
    return {
      includeActive: {
        group: optionGroup,
        description: 'whether active keys should be included in the output',
        default: true,
        type: 'boolean',
      },
      includeInactive: {
        group: optionGroup,
        description: 'whether inactive keys should be included in the output',
        default: true,
        type: 'boolean',
      },
      ...GlobalKubernetesConfigurationOptions(),
    }
  }

  async execute({ includeActive, includeInactive, ...unusedConfig }: GetSealedSecretsKeyConfiguration) : Promise<Result> {
    const labelSelectors: string[] = []

    if (!includeActive && !includeInactive) {
      throw new Error('At least one of [includeActive, includeInactive] must be true.')
    }

    labelSelectors.push('sealedsecrets.bitnami.com/sealed-secrets-key')
    if (!includeInactive) {
      labelSelectors.push('sealedsecrets.bitnami.com/sealed-secrets-key=active')
    } else if (!includeActive) {
      labelSelectors.push('sealedsecrets.bitnami.com/sealed-secrets-key!=active')
    }

    this.log.debug('Label Selectors: ', JSON.stringify(labelSelectors))

    const kubectl = createKubectl()
    return kubectl.print('secrets', {
      ...unusedConfig,
      includeAllNamespaces: true,
      labelSelector: labelSelectors,
      labelColumns: 'sealedsecrets.bitnami.com/sealed-secrets-key',
      sortBy: '{.metadata.creationTimestamp}',
    }, this.log.info).then(() => this.success())
  }
}