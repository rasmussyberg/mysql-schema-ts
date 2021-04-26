import { Table, TableNonTsType } from '@/../service/generator'
import { mapValues } from 'lodash'
import { Enums } from './mysql-client'

interface MapColumnOptions {
  /** Treats binary fields as strings */
  BinaryAsBuffer: boolean
}

const options: MapColumnOptions = {
  BinaryAsBuffer: Boolean(process.env.BINARY_AS_BUFFER),
}

export function mapColumn(Table: TableNonTsType, enumTypes: Enums): Table {
  return mapValues(Table, (column) => {
    const name = column.udtName
    const tsType = findTsType(name)
    const enumType = findEnumType(name, enumTypes)

    return {
      ...column,
      tsType: tsType ?? enumType,
    }
  })
}

function findEnumType(udtName: string, enumTypes: Enums) {
  const enumType: string[] | undefined = enumTypes[udtName]
  return enumType?.map((s) => `'${s}'`).join(' | ') ?? 'any'
}

function findTsType(udtName: string): string | null {
  switch (udtName) {
    case 'char':
    case 'varchar':
    case 'text':
    case 'tinytext':
    case 'mediumtext':
    case 'longtext':
    case 'time':
    case 'geometry':
    case 'set':
    case 'enum':
      // keep set and enum defaulted to string if custom type not mapped
      return 'string'
    case 'integer':
    case 'int':
    case 'tinyint':
    case 'smallint':
    case 'mediumint':
    case 'bigint':
    case 'double':
    case 'decimal':
    case 'numeric':
    case 'float':
    case 'year':
      return 'number'
    case 'json':
      return 'JSONValue'
    case 'date':
    case 'datetime':
    case 'timestamp':
      return 'Date'
    case 'tinyblob':
    case 'mediumblob':
    case 'longblob':
    case 'blob':
    case 'binary':
    case 'varbinary':
    case 'bit':
      return options.BinaryAsBuffer ? 'Buffer' : 'string'
    default:
      return null
  }
}
