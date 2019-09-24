import { OptionsConfiguration, ResourceName } from '../kubectl'
import { AbstractCommand } from './abstract-kubectl-command'
import { Logger } from '../../logger'
import {
  GlobalKubectlOptions,
  GlobalKubectlOptionsConfiguration,
  QueryOptions,
  QueryOptionsConfiguration,
} from '../options'

export type GetFormat = 'json' | 'yaml' | 'wide' | 'name' | 'custom-columns'
export interface GetOptions extends GlobalKubectlOptions, QueryOptions {
  chunkSize?: number
  includeAllNamespaces?: boolean
  sortBy?: string
}

export const GetOptionsConfiguration: OptionsConfiguration<GetOptions> = {
  ...GlobalKubectlOptionsConfiguration,
  ...QueryOptionsConfiguration,
  chunkSize: {
    default: 0,
    flag: 'chunk-size',
  },
  sortBy: 'sort-by',
} as const

export class GetCommand extends AbstractCommand<GetOptions> {
  constructor(log?: Logger) {
    super(GetOptionsConfiguration, log)
  }

  execute(kind: ResourceName, options: GetOptions) {
    return this.executeCommand('get', options, [kind, '-o', 'json'])
      .then(({ stdout }) => {
        return JSON.parse(stdout)
      })
  }
}
