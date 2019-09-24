import * as fs from 'fs'

import { error, exec, rm, test, tempdir } from 'shelljs'
import { parseKey } from 'sshpk'

import { Logging } from './logger'

const keypair = require('keypair')
const uniqueFilename = require('unique-filename')

const log = Logging.getLogger('sshkeygen')

export interface KeyPair {
  private: string
  public: string
}

export interface KeyGenOptions {
  bits: number
}

const generateNatively = ({ bits }: KeyGenOptions) => {
  const privateKeyFile = uniqueFilename(tempdir())
  const publicKeyFile = `${privateKeyFile}.pub`

  log.info('Attempting key generation using native method...')

  try {
    exec(`ssh-keygen -f ${privateKeyFile} -t rsa -b ${bits} -N ""`)
    return error() ? undefined : {
      private: fs.readFileSync(privateKeyFile).toString(),
      public: fs.readFileSync(publicKeyFile).toString(),
    }
  } finally {
    if (test('-f', privateKeyFile)) {
      log.debug('Removing private key file...')
      rm(privateKeyFile)
    }

    if (test('-f', publicKeyFile)) {
      log.debug('Removing public key file...')
      rm(publicKeyFile)
    }
  }
}

const generateInJavascript = ({ bits }: KeyGenOptions) => {
  log.warn('Falling back to Javascript key generation...')

  const pemKeys = keypair({ bits })
  const key = parseKey(pemKeys.public, 'pem')

  return {
    private: pemKeys.private,
    public: `${key.toString('ssh')}\n`,
  }
}

export const generateKeyPair = (options: KeyGenOptions): KeyPair => {
  // try to use ssh-keygen, if available, otherwise fallback to (Slow!) Javascript
  let keyPair = generateNatively(options)
  return keyPair != undefined ? keyPair : generateInJavascript(options)
}