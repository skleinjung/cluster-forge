import * as path from 'path'

import * as appRoot from 'app-root-path'

import { ConfigurationOptions } from '../../modular-cli'

export interface GlobalBlueprintConfiguration {
  blueprintRoot: string
  kustomizationRoot: string
  name: string
}

export const GlobalBlueprintConfigurationOptions = (): ConfigurationOptions<GlobalBlueprintConfiguration> => {
  const configGroup = 'Blueprint Options:'
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
  }
}