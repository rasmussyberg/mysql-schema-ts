export type Options = {
  table: string
  prefix: string
} & MapColumnOptions

export type MapColumnOptions = {
  tinyIntAsBoolean: boolean
  binaryAsBuffer: boolean
}
