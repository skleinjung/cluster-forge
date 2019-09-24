const path = require('path')
const appRoot = require('app-root-path')

const exists = (value) => {
  return typeof value !== 'undefined' && value
}

// noinspection JSUnusedGlobalSymbols
module.exports = {
  helpers: {
    getGitPath: (absolutePath) => {
      const dir = path.relative(appRoot.path, absolutePath)
      return dir.replace(/[\\\/]/g, "/")
    },
    getKustomizationPath: (kustomizationRoot, kustomizationPath) => {
      if (exists(kustomizationPath)) {
        const [base, options] = kustomizationRoot.split('?')
        const path = [base.replace(/\/+$/, ''), kustomizationPath.replace(/^\//, '')].join('/')
        return exists(options) ? [path, options].join('?') : path
      } else {
        return kustomizationRoot
      }
    },
  }
}