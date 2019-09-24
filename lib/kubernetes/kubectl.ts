import { forEach, get as lodashGet, head, isArray, join, map, split, trim } from 'lodash'
import * as shell from 'shelljs'
import { ShellString } from 'shelljs'

import { Logging } from '../logger'

import { PrintCommand, PrintOptions } from './commands/print'
import { GetCommand, GetOptions } from './commands/get'
import { ApplyCommand, ApplyOptions, ApplyResult } from './commands/apply'
import { WaitCommand, WaitOptions } from './commands/wait'
import { KubectlCommandResult } from './commands/abstract-kubectl-command'

const log = Logging.getLogger('kubernetes')

// Source: https://kubernetes.io/docs/reference/kubectl/overview/#resource-types
// Command: kubectl api-resources -o name --no-headers
// Current as of:
//    Client Version: version.Info{Major:"1", Minor:"14", GitVersion:"v1.14.6", GitCommit:"96fac5cd13a5dc064f7d9f4f23030a6aeface6cc", GitTreeState:"clean", BuildDate:"2019-08-19T11:13:49Z", GoVersion:"go1.12.9", Compiler:"gc", Platform:"windows/amd64"}
//    Server Version: version.Info{Major:"1", Minor:"16", GitVersion:"v1.16.0", GitCommit:"2bd9643cee5b3b3a5ecbd3af49d09018f0773c77", GitTreeState:"clean", BuildDate:"2019-09-18T14:27:17Z", GoVersion:"go1.12.9", Compiler:"gc", Platform:"linux/amd64"}
export type KubectlResourceName =
  'bindings' |
  'componentstatuses' |
  'configmaps' |
  'endpoints' |
  'events' |
  'limitranges' |
  'namespaces' |
  'nodes' |
  'persistentvolumeclaims' |
  'persistentvolumes' |
  'pods' |
  'podtemplates' |
  'replicationcontrollers' |
  'resourcequotas' |
  'secrets' |
  'serviceaccounts' |
  'services' |
  'mutatingwebhookconfigurations.admissionregistration.k8s.io' |
  'validatingwebhookconfigurations.admissionregistration.k8s.io' |
  'customresourcedefinitions.apiextensions.k8s.io' |
  'apiservices.apiregistration.k8s.io' |
  'controllerrevisions.apps' |
  'daemonsets.apps' |
  'deployments.apps' |
  'replicasets.apps' |
  'statefulsets.apps' |
  'tokenreviews.authentication.k8s.io' |
  'localsubjectaccessreviews.authorization.k8s.io' |
  'selfsubjectaccessreviews.authorization.k8s.io' |
  'selfsubjectrulesreviews.authorization.k8s.io' |
  'subjectaccessreviews.authorization.k8s.io' |
  'horizontalpodautoscalers.autoscaling' |
  'cronjobs.batch' |
  'jobs.batch' |
  'sealedsecrets.bitnami.com' |
  'certificatesigningrequests.certificates.k8s.io' |
  'leases.coordination.k8s.io' |
  'events.events.k8s.io' |
  'ingresses.extensions' |
  'ingresses.networking.k8s.io' |
  'networkpolicies.networking.k8s.io' |
  'runtimeclasses.node.k8s.io' |
  'poddisruptionbudgets.policy' |
  'podsecuritypolicies.policy' |
  'clusterrolebindings.rbac.authorization.k8s.io' |
  'clusterroles.rbac.authorization.k8s.io' |
  'rolebindings.rbac.authorization.k8s.io' |
  'roles.rbac.authorization.k8s.io' |
  'priorityclasses.scheduling.k8s.io' |
  'csidrivers.storage.k8s.io' |
  'csinodes.storage.k8s.io' |
  'storageclasses.storage.k8s.io' |
  'volumeattachments.storage.k8s.io'
export type CustomResourceName = string
export type ResourceName = KubectlResourceName | CustomResourceName

export interface KubectlConfiguration {
  cluster?: string
  context?: string
  insecureSkipTlsVerify?: boolean
  namespace?: string
  requestTimeout?: number
  verbosity?: number
  waitTimeout?: number
}

export interface OptionConfiguration<TValue = any> {
  default?: TValue
  flag: string
  convert?: (value: TValue) => string
}
export type OptionsConfiguration<TOptions> = { [key in keyof TOptions]: string | OptionConfiguration<TOptions[key]> }

export type Command = 'create' | 'apply'

export type Name = string
export type LabelSelector = string[]

interface ResourceSelection {
  kind: string
  namespace?: string
  query: Name | LabelSelector
}

interface WaitConfig extends ResourceSelection {
  condition?: string
  timeout?: number
  timeoutCallback?: (config: WaitConfig) => void
}

interface DeploymentOptions {
  command?: Command
  kustomize?: boolean
  path: string
  waitConfigs?: WaitConfig[]
}

export interface Pod {
  [key: string]: any
  metadata: {
    name: string
  }
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
  apply: (options: ApplyOptions) => Promise<ApplyResult>
  applyLegacy: (path: string, kustomize?: boolean) => void
  deploy: (deploymentOptions: DeploymentOptions) => any
  runCommand: (args: string[], shellOptions?: {}) => ShellString
  get: (kind: ResourceName, options: GetOptions) => Promise<object>
  getDeploymentPods: (name: string, namespace?: string) => Pod
  getEvents: (kind: string, name: string, namespace?: string) => any
  getPodLogs: (name: string, namespace?: string, { container, tail }?: { container?: any; tail?: any }) => string[]
  getResources: (type: string, options?: string[]) => any
  print: (kind: ResourceName, options: PrintOptions, printFn?: (line: string) => void) => Promise<string>
  isPending: (path: string, { condition }: { condition?: any }) => boolean
  wait: (options: WaitOptions) => Promise<KubectlCommandResult>
}

export const createKubectl = (): Kubectl => {
  const apply = new ApplyCommand()
  const get = new GetCommand()
  const print = new PrintCommand()
  const wait = new WaitCommand()

  const runCommand = (args: string[], shellOptions: {} = { silent: true }) => {
    const config = {
      cluster: undefined,
      context: undefined,
      insecureSkipTlsVerify: false,
    }
    const extraArgs: string[] = []
    if (config.insecureSkipTlsVerify) {
      extraArgs.push('--insecure-skip-tls-verify')
    }
    if (trim(config.context) !== '') {
      extraArgs.push(`--context=${config.context}`)
    }
    if (trim(config.cluster) !== '') {
      extraArgs.push(`--cluster=${config.cluster}`)
    }

    args.unshift(...extraArgs)
    const argString = join(map(args, (arg) => `"${arg}"`), ' ')
    const command = `kubectl ${argString}`

    log.debug(`Executing: ${command}`)

    const result = shell.exec(command, shellOptions)
    logExecResult(result)
    return result
  }

  const getResources = (type: string, options: string[] = []) => {
    return JSON.parse(runCommand([
      'get',
      type,
      '--output=json',
      ...options,
    ], { silent: true }).stdout).items
  }

  /**
   * Retrieves an array of all pods associated with the given deployment, based on it's matchLabels
   */
  const getDeploymentPods = (name: string, namespace = 'default') => {
    log.debug(`Retrieving pods for deployment "${name}" in namespace "${namespace}"`)

    const deployment = head(getResources('deployments', [
      trim(namespace) !== '' ? `--namespace=${namespace}` : '',
      `--field-selector=metadata.name=${name}`,
    ]))

    const matchLabels = lodashGet(deployment, 'spec.selector.matchLabels')
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
    const result = runCommand([
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
    const result = runCommand([
      'wait',
      `--for-condition=${condition}`,
      '-f',
      path,
      '--timeout=0',
    ])
    return result.code !== 0
  }

  const waitFor = async (waitConfig: WaitConfig) => {
    const {
      condition = 'available',
      kind,
      namespace,
      query,
      timeout = 60,
    } = waitConfig

    let result

    const kubectlArguments = [
      'wait',
      `--for=condition=${condition}`,
      `--timeout=${timeout}s`,
      trim(namespace) !== '' ? `--namespace=${namespace}` : '',
    ]

    if (isArray(query)) {
      const labelQuery = join(query, '')
      kubectlArguments.push(kind)
      kubectlArguments.push('-l')
      kubectlArguments.push(labelQuery)
      log.info(`Waiting up to ${timeout}s for ${kind}s in namespace "${namespace}" having labels: [${labelQuery}]...`)
    } else {
      const labelQuery = join(query, '')
      kubectlArguments.push(`${kind}/${name}`)
      log.info(`Waiting up to ${timeout}s for ${kind}/${name} in namespace ${namespace}..`)
    }

    result = runCommand(kubectlArguments)

    if (result.code !== 0) {
      log.error(result.stderr)
      throw new Error(`Failed waiting for condition: ${result.stderr}`)
    }

    log.info('All resources available.')
    return waitConfig
  }

  const applyLegacy = (path: string, kustomize: boolean = false) => {
    log.info('Applying:', path)

    const command = ['apply', kustomize ? '-k' : '-f', path]
    const result = runCommand(command)
    if (result.code !== 0) {
      throw new Error(result.stderr)
    }
  }

  const create = (path: string, kustomize: boolean = false) => {
    log.info('Creating:', path)

    const command = ['create', kustomize ? '-k' : '-f', path]
    const result = runCommand(command)
    if (result.code !== 0) {
      throw new Error(result.stderr)
    }
  }

  const deploy = async (options: DeploymentOptions) => {
    const { command = 'apply', path, kustomize = false, waitConfigs = [] } = options

    if (command === 'apply') {
      return kustomize ? apply.execute({ kustomization: path }) : apply.execute({ files: path })
    } else {
      return Promise.resolve().then(() => create(path, kustomize))
    }
  }

  return {
    apply: apply.execute.bind(apply),
    applyLegacy,
    deploy,
    get: get.execute.bind(get),
    getDeploymentPods,
    getEvents,
    getPodLogs,
    getResources,
    isPending,
    print: print.execute.bind(print),
    runCommand,
    wait: wait.execute.bind(wait),
  }
}
