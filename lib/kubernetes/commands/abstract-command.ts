import {
  forIn,
  get,
  has,
  isFunction,
  isNil,
  isPlainObject,
  join,
  map,
  pickBy,
  trim,
} from 'lodash'
import * as shell from 'shelljs'

import { Logging } from '../../logger'
import { OptionsConfiguration } from '../kubectl'

export class KubectlCommandResult {
  constructor(public stdout: string, public stderr: string) {}
}

export abstract class AbstractCommand<TOptions extends object = object> {
  protected constructor(
    private optionsConfiguration: OptionsConfiguration<TOptions>,
    protected log = Logging.getLogger('kubernetes')) {}

  protected async executeCommand(
    command: string,
    commandOptions?: TOptions,
    additionalArguments: string[] = [],
    shellOptions: {} = { silent: true }
  ): Promise<KubectlCommandResult> {
    const args: string[] = []
    args.push(command)
    args.push(...additionalArguments)

    this.log.debug('Initial args: ', JSON.stringify(args))

    forIn(
      pickBy(commandOptions,(_, key) => has(this.optionsConfiguration, key)),
      (value, key) => {
        this.log.debug(`Processing option: ${key}=${value}`)

        if (!has(this.optionsConfiguration, key)) {
          return
        }

        const optionConfiguration = this.optionsConfiguration[key as keyof TOptions]
        const valueWithDefault = isNil(value) && isPlainObject(optionConfiguration)
          ? get(optionConfiguration, 'default')
          : value

        this.log.debug(`After applying default: ${key}=${valueWithDefault}`)

        if (!isNil(valueWithDefault)) {
          if (typeof optionConfiguration === 'string') {
            this.log.debug(`Pushing kubectl option: --${optionConfiguration}=${valueWithDefault}`)
            args.push(`--${optionConfiguration}=${valueWithDefault}`)
          } else {
            this.log.debug('optionConfiguration: ', JSON.stringify(optionConfiguration))
            const flag = `--${get(optionConfiguration, 'flag')}`
            const convert = get(optionConfiguration, 'convert')

            this.log.debug(`Converting value using: ${convert}`)
            const convertedValue = isFunction(convert)
              ? convert(valueWithDefault)
              : valueWithDefault
            this.log.debug(`After applying conversion: ${key}=${convertedValue}`)

            this.log.debug(`Pushing kubectl option: ${flag}=${convertedValue}`)
            args.push(`${flag}=${convertedValue}`)
          }
        }
      })

    const argString = join(map(args, (arg) => `"${arg}"`), ' ')
    const commandString = `kubectl ${argString}`

    this.log.debug(`Executing: ${commandString}`)

    shell.config.fatal = false
    const { code, stdout, stderr } = shell.exec(commandString, shellOptions)
    if (code !== 0) {
      throw new Error([trim(stdout), trim(stderr), `kubectl 'get' command failed with exit code: ${code}.`].join('\n'))
    }
    return new KubectlCommandResult(stdout, stderr)
  }
}