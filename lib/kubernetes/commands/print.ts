import { toString } from 'lodash'

import { AbstractCommand } from './abstract-kubectl-command'
import { OptionsConfiguration, ResourceName } from '../kubectl'
import { Logger, logMultilineOutput } from '../../logger'
import { toCommaDelimitedList } from '../argument-utils'

import { GetFormat, GetOptionsConfiguration, GetOptions } from './get'

export interface PrintOptions extends GetOptions {
  format?: GetFormat
  labelColumns?: string | string[]
  printHeaders?: boolean
  showKind?: boolean
  showLabels?: boolean
}

export const PrintOptionsConfiguration: OptionsConfiguration<PrintOptions> = {
  ...GetOptionsConfiguration,
  format: 'format',
  labelColumns: {
    convert: toCommaDelimitedList,
    flag: 'label-columns',
  },
  printHeaders: {
    convert: (value?: boolean) => toString(value !== true),
    flag: 'no-headers',
  },
  showKind: 'show-kind',
  showLabels: 'show-labels',
} as const

export class PrintCommand extends AbstractCommand<PrintOptions> {
  constructor(log?: Logger) {
    super(PrintOptionsConfiguration, log)
  }

  async execute(kind: ResourceName, options: PrintOptions): Promise<string> {
    return this.executeCommand('get', options, [kind])
      .then(({ stderr, stdout }) => {
        if (stderr) {
          logMultilineOutput(stderr, this.log.erronly)
        }
        if (stdout) {
          logMultilineOutput(stdout, this.log.outonly)
        }
        return stdout
      })
  }
}