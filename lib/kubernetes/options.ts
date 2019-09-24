import { OptionsConfiguration } from './kubectl'
import { toCommaDelimitedList } from './argument-utils'

// global kubectl options
export interface GlobalKubectlOptions {
  cluster?: string
  context?: string
  insecureSkipTlsVerify?: boolean
  namespace?: string
  requestTimeout?: number
  verbosity?: number
}
export const GlobalKubectlOptionsConfiguration: OptionsConfiguration<GlobalKubectlOptions> = {
  cluster: 'cluster',
  context: 'context',
  insecureSkipTlsVerify: 'insecure-skip-tls-verify',
  namespace: 'namespace',
  requestTimeout: 'request-timeout',
  verbosity: 'v',
} as const

// options for querying resources
export interface QueryOptions {
  fieldSelector?: string | string[]
  includeAllNamespaces?: boolean,
  labelSelector?: string | string[]
}
export const QueryOptionsConfiguration: OptionsConfiguration<QueryOptions> = {
  fieldSelector: {
    convert: toCommaDelimitedList,
    flag: 'field-selector',
  },
  includeAllNamespaces: 'all-namespaces',
  labelSelector: {
    convert: toCommaDelimitedList,
    flag: 'selector',
  },
} as const

// options for updating resources
export interface UpdateOptions {
  dryRun?: boolean
  overwrite?: boolean
  serverDryRun?: boolean
}
export const UpdateOptionsConfiguration: OptionsConfiguration<UpdateOptions> = {
  dryRun: 'dry-run',
  overwrite: 'overwrite',
  serverDryRun: 'server-dry-run',
} as const

// options for manifest file-based operations
export interface ManifestFileOptions {
  files?: string | string[]
  recursive?: boolean
}
export const ManifestFileOptionsConfiguration: OptionsConfiguration<ManifestFileOptions> = {
  files: {
    convert: toCommaDelimitedList,
    flag: 'filename',
  },
  recursive: 'recursive',
} as const

// options for file-based update operations
export interface UpdateFromManifestOptions extends UpdateOptions, ManifestFileOptions {
  validate?: boolean
}
export const UpdateFromManifestOptionsConfiguration: OptionsConfiguration<UpdateFromManifestOptions> = {
  validate: 'validate',
} as const

