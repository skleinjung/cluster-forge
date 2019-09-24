import * as path from 'path'

import * as appRoot from 'app-root-path'

import { KubectlConfiguration } from '../kubernetes'
import { ConfigurationOptions } from '../modular-cli'

export interface BootstrapGlobalConfiguration extends KubectlConfiguration {
  name: string
  blueprintRoot: string
  kustomizationRoot: string
}

export const BootstrapGlobalConfigurationOptions = (): ConfigurationOptions<BootstrapGlobalConfiguration> => {
  const configGroup = 'Global Configuration:'
  return {
    name: {
      group: configGroup,
      description: 'name of the blueprint to bootstrap',
      required: true,
    },
    blueprintRoot: {
      group: configGroup,
      description: 'path to the directory containing blueprint definitions',
      default: 'blueprints',
      coerce: (value: string) => path.join(appRoot.path, value),
    },
    kustomizationRoot: {
      group: configGroup,
      description: 'path to the directory containing bootstrap kustomizations',
      default: 'github.com/skleinjung/cluster-forge//kustomizations?ref=master',
    },
    context: {
      group: configGroup,
      description: 'the kubectl context',
      type: 'string',
    },
    cluster: {
      group: configGroup,
      description: 'the cluster to run kubectl against',
      type: 'string',
    },
    insecureSkipTlsVerify: {
      group: configGroup,
      description: 'true if TLS certificate verification should be skipped',
      default: 'false',
    },
  }
}