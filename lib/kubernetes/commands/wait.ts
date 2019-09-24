import { isArray, isEmpty, isNil, trim } from 'lodash'

import { AbstractCommand } from './abstract-kubectl-command'
import { Logger, logMultilineOutput } from '../../logger'
import {
  GlobalKubectlOptions,
  GlobalKubectlOptionsConfiguration,
  ManifestFileOptions,
  ManifestFileOptionsConfiguration,
  QueryOptions,
  QueryOptionsConfiguration,
} from '../options'

export interface WaitOptions
  extends GlobalKubectlOptions,
  QueryOptions,
  ManifestFileOptions
{
  kind?: string,
  name?: string,
  timeout?: number
  waitFor?: string
}

export const createWaitOptionsConfiguration = () => {
  return  {
    ...GlobalKubectlOptionsConfiguration,
    ...QueryOptionsConfiguration,
    ...ManifestFileOptionsConfiguration,
    kind: 'kind',
    name: 'name',
    timeout: {
      flag: 'timeout',
      convert: (value: number) => `${value}s`,
    },
    waitFor: {
      flag: 'for',
      default: 'condition=available',
    },
  }
}
export type WaitOptionsConfiguration = ReturnType<typeof createWaitOptionsConfiguration>

/**
 * Error subclass that adds information about whether a command timed out, or failed with another error.
 */
export class WaitError extends Error {
  timedOut: boolean

  constructor(message?: string) {
    super(message ? message : 'Timed out while waiting for the condition.')
    this.timedOut = trim(message) === ''
  }
}

/**
 * Executes the kubectl `wait` command.
 */
export class WaitCommand extends AbstractCommand<WaitOptions> {
  constructor(log?: Logger) {
    super(createWaitOptionsConfiguration(), log)
  }

  execute(options: WaitOptions) {
    const { files, kind, labelSelector, name, waitFor } = options

    const isDefined = (value: string | string[] | undefined) => {
      return !isNil(value) && (
        isArray(value) ? !isEmpty(value) : (trim(value) !== '')
      )
    }

    const validate = () => {
      if (!waitFor!.match(/^(delete|[^=]+=[.+])$/)) {
        throw new Error(`waitFor condition must match [delete|condition=condition-name], was: ${waitFor}`)
      }

      const hasFiles = isDefined(files)
      const hasKind = isDefined(kind)
      const hasName = isDefined(name)
      const hasLabelSelector = isDefined(labelSelector)

      if (hasFiles) {
        if (hasKind || hasName || hasLabelSelector) {
          throw new Error('When specifying manifest files, you may not also specify any of [kind, name, labelSelector].')
        }
      } else if (!hasKind) {
        throw new Error('You must specify exactly one of [files, kind].')
      } else if (hasName && hasLabelSelector) {
        throw new Error('You may specify only one of [name, labelSelector].')
      } else if (!hasName && !hasLabelSelector) {
        throw new Error('When specifying "kind", one of [name, labelSelector] is required.')
      }
    }

    const parseErrorResults = (error: Error) => {
      const timedOut = error.message.match(/timed out/)
      if (timedOut) {
        return new WaitError()
      } else {
        logMultilineOutput(error.message, this.log.error)
        return new WaitError('Wait command execution failed.')
      }
    }

    return Promise.resolve()
      .then(() => validate())
      .then(() => this.executeCommand('wait', options))
      .catch((error) => { throw parseErrorResults(error) })
  }
}
