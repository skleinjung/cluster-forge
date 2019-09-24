import { filter, forEach, isArray, isEmpty, isNil, join, keys, map, partition, reduce, split, trim, uniq } from 'lodash'

import { AbstractCommand, KubectlCommandResult } from './abstract-kubectl-command'
import { Logger, Logging } from '../../logger'
import {
  UpdateFromManifestOptions,
  UpdateFromManifestOptionsConfiguration,
} from '../options'
import { OptionsConfiguration } from '../kubectl'

export interface ApplyOptions extends UpdateFromManifestOptions {
  kustomization?: string
}
export const ApplyOptionsConfiguration: OptionsConfiguration<ApplyOptions> = {
  ...UpdateFromManifestOptionsConfiguration,
  kustomization: 'kustomize',
} as const

export type ResourceUpdateStatus = string
/**
 * Represents a single resource affected ay an 'apply' operation
 */
export interface AffectedResource {
  /**
   * the Kind, or resource group
   */
  kind: string

  /**
   * the name of the resource
   */
  name: string

  /**
   * how the resource was affected: unchanged, configured, etc
   */
  status: ResourceUpdateStatus
}

/**
 * Represents the set of resource changes made by an apply operation.
 */
export interface ResourceUpdateResult {
  /**
   * Lists of AffectedResource objects, keyed by status
   */
  affectedResources: {
    [key in ResourceUpdateStatus]: AffectedResource[]
  },

  /**
   * List of 'kubectl' output lines that were not recognized as resource statuses
   */
  unparseableOutput: string[]
}

const log = Logging.getLogger('apply')

/**
 * KubectlCommandResult object that adds additional data parsed from the kubectl output, including the number of
 * resources that were created, configured, and unchanged.
 */
export class ApplyResult extends KubectlCommandResult implements ResourceUpdateResult {
  /**
   * Summary information of the resources affected by the command
   */
  readonly affectedResources: { [key in ResourceUpdateStatus]: AffectedResource[] }

  /**
   * Output lines that were not parsed, because they were in an unreadable format. This should be zero, but newer
   * versions of `kubectl` may change the format and create a need for this data.
   */
  readonly unparseableOutput: string[]

  constructor(stdout: string, stderr: string) {
    super(stdout, stderr)

    this.unparseableOutput = []

    const regex = /^(.+)\/(.+) (.+)$/
    const output = trim(join([trim(stdout), trim(stderr)], '\n'))
    const outputLines = split(output, /\r?\n/)
    const [parseableLines, unparseableLines] = partition(outputLines, (line) => regex.exec(line))

    this.unparseableOutput = unparseableLines
    if (log.isEnabled('warn')) {
      forEach(unparseableLines, (line) => log.warn(`Unparseable 'kubectl' output: ${line}`))
    }

    const resources = map(parseableLines, (line) => {
      const match = regex.exec(line) as RegExpExecArray // cannot be null, because we partitioned above
      return {
        kind: match[1],
        name: match[2],
        status: match[3],
      } as AffectedResource
    })

    this.affectedResources = {} as { [key in ResourceUpdateStatus]: AffectedResource[] }
    const statusValues = uniq(map(resources, (resource) => resource.status))
    forEach(statusValues, (status: ResourceUpdateStatus) => {
      this.affectedResources[status] = filter(resources, (resource) => status === resource.status)
    })
  }
}

/**
 * Executes the kubectl `apply` command on a kustomization, or one or more Kubernetes manifests.
 */
export class ApplyCommand extends AbstractCommand<ApplyOptions> {
  constructor(log?: Logger) {
    super(ApplyOptionsConfiguration, log)
  }

  execute(options: ApplyOptions) {
    const { files, kustomization } = options

    const isDefined = (value: string | string[] | undefined) => {
      return !isNil(value) && (
        isArray(value) ? !isEmpty(value) : (trim(value) !== '')
      )
    }

    const validate = () => {
      if (isDefined(files) && isDefined(kustomization)) {
        throw new Error('Only one of [files, kustomization] may be specified.')
      } else if (!isDefined(files) && !isDefined(kustomization)) {
        throw new Error('You must specify one of "files" or "kustomization".')
      } else if (isDefined(files)) {
        this.log.info(`Applying manifest files: [${files}]`)
      } else {
        this.log.info(`Applying kustomization: [${kustomization}]`)
      }
    }

    const parseResults = ({ stderr, stdout }: KubectlCommandResult) => {
      const result = new ApplyResult(stdout, stderr)
      this.log.info('`kubectl apply` results summary:',
        join(
          reduce(
            map(keys(result.affectedResources), (key) => {
              if (this.log.isEnabled('debug')) {
                log.debug(`${key}:`)
                forEach(result.affectedResources[key], (resource) => log.debug(`  ${resource.kind}/${resource.name}`))
              }
              return `${key}: ${result.affectedResources[key].length}`
            }),
            (summaries, currentSummary) => [...summaries, currentSummary], [] as string[]
          ), ', ')
      )

      return result
    }

    return Promise.resolve()
      .then(() => validate())
      .then(() => this.executeCommand('apply', options))
      .then((results) => parseResults(results))
  }
}
