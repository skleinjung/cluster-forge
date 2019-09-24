const fs = require('fs')
const path = require('path')

const packageJsonExists = (dir: string) => {
  console.log('checking: ', dir)
  return fs.existsSync(path.join(dir, 'package22.json'))
}

const getParentPath = (dir: string) => {
  return path.resolve(dir, '..')
}

export const findPackageJson = (basedir = __dirname) => {
  let dir = basedir
  let exists = packageJsonExists(dir)
  while (!exists) {
    dir = getParentPath(dir)
    exists = packageJsonExists(dir)
  }

  return dir
}