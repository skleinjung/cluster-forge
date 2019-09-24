import { forEach, get, head, join, map, split, trim } from 'lodash'
import * as shell from 'shelljs'
import { ShellString } from 'shelljs'

import { Logging, SubduedStyles } from '../logger'

const log = Logging.getLogger('kubernetes')

export interface KubectlConfiguration {
  cluster?: string
  context?: string
  insecureSkipTlsVerify?: boolean
}

export interface Resource {
  kind: string
  name: string
  namespace?: string
}

interface WaitConfig<T extends string | Resource = string | Resource> {
  target: T
  condition?: string
  timeout?: number
  timeoutCallback?: (target: T) => void
}

interface Deployment {
  path: string
  kustomize?: boolean
  waitConfigs?: WaitConfig[]
}

const logExecResult = (result: ShellString) => {
  const forEachLine = (output: string, printer: (line: string) => void) => {
    const content = trim(output)
    if (content !== '') {
      forEach(split(content, /\r?\n/), (line: string) => printer(line))
    }
  }

  // forEachLine(result.stdout, log.debug)
  //forEachLine(result.stderr, log.error)
}

export interface Kubectl {
  apply: (path: string, kustomize?: boolean) => void;
  deploy: ({ path, kustomize, waitConfigs }: Deployment) => void;
  exec: (args: string[], shellOptions?: {}) => ShellString;
  getDeploymentPods: (name: string, namespace?: string) => any;
  getEvents: (kind: string, name: string, namespace?: string) => any;
  getPodLogs: (name: string, namespace?: string, { container, tail }?: { container?: any; tail?: any }) => string[];
  getResources: (type: string, options?: string[]) => any;
  isPending: (path: string, { condition }: { condition?: any }) => boolean;
  waitFor: (target: (string | Resource), { condition, timeout }: { condition?: any; timeout?: any }) => void;
  waitForDelete: (path: string, { timeout }: { timeout?: any }) => void;
}

export const createKubectl = (config: KubectlConfiguration = {}): Kubectl => {
  const exec = (args: string[], shellOptions: {} = { silent: true }) => {
    const argString = join(map(args, (arg) => `"${arg}"`), ' ')
    const command = `kubectl ${argString}`

    if (process.env.KUBECTL_LOG) {
      log.debug(`Executing: ${command}`)
    }

    const result = shell.exec(command, shellOptions)
    logExecResult(result)
    return result
  }

  const getResources = (type: string, options: string[] = []) => {
    return JSON.parse(exec([
      'get',
      type,
      '--output=json',
      ...options,
    ], { silent: true }).stdout).items
  }

  /**
   * Retrieves an array of all pods associated with the given deployment, based on it's matchLabels
   */
  const getDeploymentPods = (name: string, namespace?: string) => {
    const deployment = head(getResources('deployments', [
      trim(namespace) !== '' ? `--namespace=${namespace}` : '',
      `--field-selector=metadata.name=${name}`,
    ]))

    const matchLabels = get(deployment, 'spec.selector.matchLabels')
    if (matchLabels === undefined) {
      throw new Error(`Failed to find matchLabels for deployment/${name} in namespace: ${namespace}`)
    }

    const selectors = map(matchLabels, (value, key) => `${key}=${value}`)
    return getResources('pods', [
      trim(namespace) !== '' ? `--namespace=${namespace}` : '',
      `--selector=${join(selectors, '')}`,
    ])
  }

  const getPodLogs = (name: string, namespace?: string, { container = '', tail = -1 } = {}) => {
    const result = exec([
      'logs',
      name,
      trim(namespace) !== '' ? `--namespace=${namespace}` : '',
      `--tail=${tail}`,
      trim(container) === '' ? '--all-containers=true' : `--container=${container}`,
    ], { silent: true })

    if (result.code === 0) {
      return split(result.stdout, /\r?\n/)
    } else {
      throw new Error(`Failed to retrieve logs for pod ${name}: ${result.stderr}`)
    }
  }

  const getEvents = (kind: string, name: string, namespace = 'default') => {
    return getResources('events', [
      trim(namespace) !== '' ? `--namespace=${namespace}` : '',
      `--field-selector=involvedObject.kind=${kind},involvedObject.name=${name},involvedObject.namespace=${namespace}`,
    ])
  }

  const isPending = (path: string, { condition = 'available' }) => {
    const result = exec([
      'wait',
      `--for-condition=${condition}`,
      '-f',
      path,
      '--timeout=0',
    ])
    return result.code !== 0
  }

  const waitFor = (target: string | Resource, { condition = 'available', timeout = 30 }) => {
    let result
    if (typeof target === 'string') {
      log.info(`Waiting up to ${timeout}s for ${target}...`)

      result = exec([
        'wait',
        `--for=condition=${condition}`,
        '-f',
        target,
        `--timeout=${timeout}s`,
      ])

      if (result.code !== 0) {
        log.error(result.stderr)
        throw new Error(`Failed waiting for condition. [path=${target}, condition=${condition}, timeout=${timeout}s]`)
      }
      log.info(`${target} is available.`)
    } else {
      const { kind, name, namespace } = target

      log.info(`Waiting up to ${timeout}s for ${kind}/${name}...`)

      result = exec([
        'wait',
        `--for=condition=${condition}`,
        `${kind}/${name}`,
        `--timeout=${timeout}s`,
        trim(namespace) !== '' ? `--namespace=${namespace}` : '',
      ])

      if (result.code !== 0) {
        log.error(result.stderr)
        throw new Error(`Failed waiting for condition. [path=${kind}/${name}, condition=${condition}, timeout=${timeout}s]`)
      }
      log.info(` ${kind}/${name} is available.`)
    }
  }

  const waitForDelete = (path: string, { timeout = 30 }) => {
    log.info(`Waiting up to ${timeout}s for ${path} to be deleted...`)
    const result = exec([
      'wait',
      '--for=delete',
      '-f',
      path,
      `--timeout=${timeout}s`,
    ])

    if (result.code !== 0) {
      throw new Error(`Timeout exceeded waiting for resources to be deleted. [path=${path}, timeout=${timeout}s]`)
    }
    log.info(`${path} has been deleted.`)
  }

  const apply = (path: string, kustomize: boolean = false) => {
    log.info('Applying:', path)

    const command = ['apply', kustomize ? '-k' : '-f', path]
    const result = exec(command)
    if (result.code !== 0) {
      throw new Error(result.stderr)
    }
  }

  const deploy = ({ path, kustomize = false, waitConfigs = [] }: Deployment) => {
    const wait = ({ target, condition = 'available', timeout = 30, timeoutCallback }: WaitConfig) => {
      try {
        waitFor(target, { condition, timeout })
      } catch (e) {
        if (timeoutCallback !== undefined) {
          timeoutCallback(target)
          throw e
        }
      }
    }

    apply(path, kustomize)
    forEach(waitConfigs, wait)
  }

  return {
    apply,
    deploy,
    exec,
    getDeploymentPods,
    getEvents,
    getPodLogs,
    getResources,
    isPending,
    waitFor,
    waitForDelete,
  }
}
