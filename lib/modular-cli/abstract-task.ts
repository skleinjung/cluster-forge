import { Options } from 'yargs'

export type ConfigurationOptions<T extends object = {}> = { [key in keyof T]: Options }

export type ResultCode = 'success' | 'error'

export interface Result<TContext extends object = any> {
  result: ResultCode
  context?: TContext
}

export abstract class AbstractTask<
  TConfig extends object = any,
  TInputContext extends object = any,
  TOutputContext extends object = any,
  TErrorContext extends object = any
> {
  abstract getConfigurationOptions(): ConfigurationOptions<TConfig>
  abstract execute(configuration: TConfig, context?: TInputContext): Promise<Result<TOutputContext>>

  protected error = (outputContext?: TErrorContext) => ({ result: 'error' as ResultCode, context: outputContext })
  protected success = (outputContext?: TOutputContext) => ({ result: 'success' as ResultCode, context: outputContext })
}