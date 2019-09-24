import * as appRoot from 'app-root-path'
import simplegit, { BranchSummary } from 'simple-git/promise'

import { AbstractTask, ConfigurationOptions, Result } from '../modular-cli'
import { Logger, Logging } from '../logger'

export interface GitContext {
  git: {
    url: string
    branch: string
  }
}

export class GetGitContext extends AbstractTask<{}, object, GitContext> {
  private log: Logger = Logging.getLogger('get-git-context')

  getConfigurationOptions(): ConfigurationOptions<{}> {
    return {}
  }

  async execute() : Promise<Result> {
    return Promise.resolve()
      .then(() => {
        const git = simplegit(appRoot.path)
        return Promise.all([
          git.listRemote(['--get-url']).then((url: string) => url.trim()),
          git.branchLocal().then((branchSummary: BranchSummary) => branchSummary.current.trim()),
        ])
      })
      .then(([gitUrl, gitBranch]) => {
        this.log.info(`Git URL: ${gitUrl}`)
        this.log.info(`Git branch: ${gitBranch}`)
        return this.success({
          git: {
            url: gitUrl,
            branch: gitBranch,
          },
        })
      })
      .catch((error) => {
        throw new Error('Failed to retrieve git information: ' + error)
      })
  }
}