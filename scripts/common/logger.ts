import chalk, { Chalk } from 'chalk'
import { join } from 'lodash'

const log = console.log

export type LogLevel = 'error' | 'warn' | 'info' | 'debug'

export type Styles = {
  [key in LogLevel]: Chalk
}

export const DefaultStyles = {
  error: chalk.red,
  warn: chalk.yellow,
  info: chalk.whiteBright,
  debug: chalk.gray,
}
export const SubduedStyles = {
  error: chalk.yellow,
  warn: chalk.whiteBright,
  info: chalk.white,
  debug: chalk.dim.gray,
}

export class Logger {
  private readonly category: string
  private readonly styles: Styles = SubduedStyles
  private enabled: boolean = true

  public constructor(category: string, styles: Partial<Styles> = {}) {
    this.category = category
    this.styles = { ...DefaultStyles, ...styles }
  }

  public isEnabled = () => this.enabled

  public setEnabled = (enabled: boolean) => { this.enabled = enabled }

  public setStyle = (level: LogLevel, style: Chalk) => {
    this.styles[level] = style
  }

  public error = (message?: any, ...optionalParams: any[]) => {
    this.logIfEnabled('error', message, optionalParams)
  }

  public warn = (message?: any, ...optionalParams: any[]) => {
    this.logIfEnabled('warn', message, optionalParams)
  }

  public info = (message?: any, ...optionalParams: any[]) => {
    this.logIfEnabled('info', message, optionalParams)
  }

  public debug = (message?: any, ...optionalParams: any[]) => {
    this.logIfEnabled('debug', message, optionalParams)
  }

  private logIfEnabled = (level: LogLevel, message?: any, ...optionalParams: any[]) => {
    if (this.isEnabled()) {
      log(this.styles[level](`[${this.category}]`, message, join(optionalParams, '')))
    }
  }
}

export const Logging = (() => {
  const loggers: { [key: string]: Logger } = { }

  const getLogger = (category: string, styles?: Partial<Styles>) => {
    let result = loggers[category]
    if (result === undefined) {
      result = new Logger(category, styles)
      loggers[category] = result
    }
    return result
  }

  return {
    disable: (category: string) => getLogger(category).setEnabled(false),
    enable: (category: string) => getLogger(category).setEnabled(true),
    getLogger,
  }
})()
