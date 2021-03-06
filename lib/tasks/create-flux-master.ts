// import * as path from 'path'
//
// import * as appRoot from 'app-root-path'
// import simplegit, { BranchSummary } from 'simple-git/promise'
// import { echo, env, exec, rm, tempdir, test } from 'shelljs'
//
// import { ConfigurationOptions, Task, Result } from '../modular-cli'
// import { generateKeyPair } from '../sshkeygen'
// import { Logger, Logging } from '../logger'
// import { createKubectl, createKubernetesLogger } from '../kubernetes'
//
// import { GlobalKubernetesConfiguration, BootstrapGlobalConfigurationOptions } from './config/kubernetes-global-configuration'
//
// const uniqueFilename = require('unique-filename')
//
// env['FORCE_COLOR'] = '0'
//
// interface CreateFluxMasterConfiguration extends GlobalKubernetesConfiguration {
//   fluxNamespace?: string
// }
//
// export default class CreateFluxMasterTask extends Task<CreateFluxMasterConfiguration> {
//   private log: Logger = Logging.getLogger('create-flux-master')
//
//   async execute({ kustomizationRoot, name, blueprintRoot }: CreateFluxMasterConfiguration): Promise<Result> {
//     const kubectl = createKubectl()
//     const kubernetesLogger = createKubernetesLogger(kubectl)
//     const blueprintPath = path.join(blueprintRoot, name)
//
//     const git = simplegit(appRoot.path)
//     const [gitUrl, gitBranch] = await Promise.all([
//       git.listRemote(['--get-url']).then((url: string) => url.trim()),
//       git.branchLocal().then((branchSummary: BranchSummary) => branchSummary.current.trim()),
//     ]).catch((error) => {
//       throw new Error('Failed to retrieve git information: ' + error)
//     })
//
//     this.log.info('Generating Git deploy key (this may take awhile)...')
//     const keys = generateKeyPair({ bits: 4096 })
//     this.log.info('Key generation complete.')
//
//     this.log.info(`Git URL: ${gitUrl}`)
//     this.log.info(`Git branch: ${gitBranch}`)
//
//     const privateKeyFile = uniqueFilename(tempdir())
//     try {
//       echo('-n', keys.private).to(privateKeyFile)
//       this.log.info('Public Key:')
//       echo('-n', keys.public)
//       this.log.info('End public key.')
//
//       const command =
//         'hygen cluster configure-flux' +
//           ` --name "${name}"` +
//           ` --gitUrl "${gitUrl}"` +
//           ` --gitBranch "${gitBranch}"` +
//           ` --privateKeyFile ${privateKeyFile}` +
//           ` --blueprintRoot "${blueprintRoot}"` +
//           ` --kustomizationRoot "${kustomizationRoot}"`
//
//       this.runShellCommand(command)
//     } finally {
//       if (test('-f', privateKeyFile)) {
//         this.log.debug('Removing private key file...')
//         rm(privateKeyFile)
//       }
//     }
//
//     kubectl.deploy({
//       kustomize: true,
//       path: path.join(blueprintPath, 'bootstrap'),
//       waitConfigs: [{
//         target: {
//           kind: 'deployment',
//           namespace: 'bootstrap',
//           query: 'flux-bootstrap',
//         },
//         timeout: 180,
//         timeoutCallback: () => kubernetesLogger.logDeploymentState('flux-bootstrap', 'bootstrap'),
//       }],
//     })
//
//     return { result: 'success' }
//   }
//
//   private runShellCommand = (command: string) => {
//     this.log.debug(`Executing: ${command}`)
//     const result = exec(command, { silent: true })
//     this.log.execResults(result)
//     if (result.result !== 0) {
//       throw new Error('Command execution failed. See above output.')
//     }
//   }
// }