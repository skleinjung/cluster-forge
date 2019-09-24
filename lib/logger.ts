import chalk, { Chalk } from 'chalk'
import { forEach, isPlainObject, join, split, trim } from 'lodash'
import { ShellString } from 'shelljs'

const log = console.log

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'outonly' | 'erronly'

export type Styles = {
  [key in LogLevel]: Chalk
}

const palette = [
  chalk.yellow,
  chalk.cyan,
  chalk.green,
  chalk.magenta,
  // chalk.blue,
  // chalk.red,
  // chalk.white,
  chalk.redBright,
  chalk.greenBright,
  chalk.yellowBright,
  chalk.blueBright,
  chalk.magentaBright,
  chalk.cyanBright,
  chalk.whiteBright,
]
let currentColorIndex = 0

export const DefaultStyles = {
  error: chalk.yellow,
  warn: chalk.whiteBright,
  info: chalk.white,
  debug: chalk.dim.gray,
  outonly: chalk.white,
  erronly: chalk.red,
}

export const logMultilineOutput = (output: string, printFn: (line: string) => void) => {
  const content = trim(output)
  if (content !== '') {
    const lines = split(content, /\r?\n/)
    forEach(lines, (line) => printFn(line))
  }
}

export class Logger {
  private readonly category: string
  private readonly styles: Styles = DefaultStyles
  private enabled: { [key in LogLevel]: boolean } = {
    debug: true,
    info: true,
    warn: true,
    error: true,
    outonly: true,
    erronly: true,
  }

  public constructor(category: string, styles: Partial<Styles> = {}) {
    const color = palette[currentColorIndex++ % palette.length]

    this.category = category
    this.styles = {
      ...DefaultStyles,
      ...({
        error: color.bold,
        warn: color,
        info: color,
        debug: color.dim,
      }),
      ...styles,
    }
  }

  public isEnabled = (level: LogLevel) => {
    return this.enabled[level]
  }

  public setEnabled = (level: LogLevel, enabled: boolean) => { this.enabled[level] = enabled }

  public setStyle = (level: LogLevel, style: Chalk) => {
    this.styles[level] = style
  }

  public error = (message?: any, ...optionalParams: any[]) => {
    this.logIfEnabled('error', message, optionalParams)
  }

  public warn = (message?: any, ...optionalParams: any[]) => {
    this.logIfEnabled('warn', message,  optionalParams)
  }

  public info = (message?: any, ...optionalParams: any[]) => {
    this.logIfEnabled('info', message, optionalParams)
  }

  public debug = (message?: any, ...optionalParams: any[]) => {
    this.logIfEnabled('debug', message, optionalParams)
  }

  public outonly = (message?: any, ...optionalParams: any[]) => {
    this.logIfEnabled('outonly', message, optionalParams)
  }

  public erronly = (message?: any, ...optionalParams: any[]) => {
    this.logIfEnabled('erronly', message, optionalParams)
  }

  public execResults = (result: ShellString, stdoutLogLevel: LogLevel | 'none' = 'info', stderrLogLevel: LogLevel | 'none' = 'error') => {
    const forEachLine = (output: string, printer: (line: string) => void) => {
      const content = trim(output)
      if (content !== '') {
        forEach(split(content, /\r?\n/), (line: string) => printer(line))
      }
    }

    const logOutput = (output: string, level: LogLevel | 'none') => {
      switch (level) {
        case 'error':
          forEachLine(output, this.error)
          break
        case 'warn':
          forEachLine(output, this.warn)
          break
        case 'info':
          forEachLine(output, this.info)
          break
        case 'debug':
          forEachLine(output, this.debug)
          break
      }
    }

    logOutput(result.stdout, stdoutLogLevel)
    logOutput(result.stderr, stderrLogLevel)
  }

  private logIfEnabled = (level: LogLevel, message?: any, ...optionalParams: any[]) => {
    if (this.isEnabled(level)) {
      let messageToPrint = message
      if (isPlainObject(message)) {
        messageToPrint = message.toString()
      }

      if (level !== 'outonly' && level !== 'erronly') {
        messageToPrint = `[${level.charAt(0).toUpperCase()}] [${this.category}] ${messageToPrint}`
      }

      log(this.styles[level](messageToPrint, join(optionalParams, '')))
    }
  }
}

const loggers: { [key: string]: Logger } = { }
export const Logging = (() => {
  const getLogger = (category: string, styles?: Partial<Styles>) => {
    let result = loggers[category]
    if (result === undefined) {
      result = new Logger(category, styles)
      if (!process.env.DEBUG) {
        result.setEnabled('debug', false)
      }
      loggers[category] = result
    }
    return result
  }

  return {
    getLogger,
  }
})()
