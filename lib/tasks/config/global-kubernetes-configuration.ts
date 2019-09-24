import { KubectlConfiguration } from '../../kubernetes'
import { ConfigurationOptions } from '../../modular-cli'

export interface GlobalKubernetesConfiguration extends KubectlConfiguration {}

export const GlobalKubernetesConfigurationOptions = (): ConfigurationOptions<GlobalKubernetesConfiguration> => {
  const configGroup = 'kubectl Options:'
  return {
    cluster: {
      group: configGroup,
      description: 'the cluster to run kubectl against',
      type: 'string',
    },
    context: {
      group: configGroup,
      description: 'the kubectl context',
      type: 'string',
    },
    insecureSkipTlsVerify: {
      group: configGroup,
      description: 'true if TLS certificate verification should be skipped',
      type: 'boolean',
    },
    requestTimeout: {
      group: configGroup,
      description: 'timeout, in seconds, to wait for kubectl commands to execute',
      type: 'number',
    },
    verbosity: {
      group: configGroup,
      description: 'kubectl logging verbosity (0-9)',
      type: 'number',
    },
    waitTimeout: {
      group: configGroup,
      description: 'timeout, in seconds, to wait for Kubernetes objects to stabilize',
      type: 'number',
    },
  }
}