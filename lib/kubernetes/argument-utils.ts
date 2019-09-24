import { castArray, isNil, join } from 'lodash'

export const toCommaDelimitedList = (value?: string | string[]) => {
  return isNil(value) ? '' : join(castArray(value), ',')
}

