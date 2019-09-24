import { forEach, get } from 'lodash'

import { Logging } from '../logger'

import { Kubectl } from './kubectl'

export const createKubernetesLogger = (kubectl: Kubectl) => {
  const log = Logging.getLogger('kubernetes')

  const dumpPodState = (pod: object) => {
    const podName = get(pod, 'metadata.name')
    const podNamespace = get(pod, 'metadata.namespace', 'default')

    log.debug(`Details for pod: ${podName}`)
    forEach(get(pod, 'status.containerStatuses'), (containerStatus: object) => {
      log.debug(`  container: ${get(containerStatus, 'name')}`)
      log.debug(`    restartCount: ${get(containerStatus, 'restartCount')}`)
      log.debug(`    state: ${JSON.stringify(get(containerStatus, 'state'))}`)

      log.debug('    Events:')
      const events = kubectl.getEvents('Pod', podName, podNamespace)
      forEach(events, (event: object) => {
        const reason = get(event, 'reason', 'No Reason')
        const message = get(event, 'message', 'No Message')
        log.debug(`      [${reason}]: ${message}`)
      })

      log.debug('    Logs:')
      const podLogs = kubectl.getPodLogs(podName, podNamespace, { tail: 10 })
      forEach(podLogs, (line: string) => {
        log.debug('      ', line)
      })
    })
  }

  const logDeploymentState = (name: string, namespace?: string) => {
    const pods = kubectl.getDeploymentPods(name, namespace)
    forEach(pods, dumpPodState)
  }

  return {
    logDeploymentState,
  }
}