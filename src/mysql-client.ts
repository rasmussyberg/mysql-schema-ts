import { createConnection, Connection, QueryError } from 'mysql2'
import { parse as urlParse } from 'url'
import { Table, TableNonTsType } from '@/../src/generator'
import { mapColumn } from './column-map'
import { SQL as sql, SQLStatement } from 'sql-template-strings'

function parseEnum(dbEnum: string): string[] {
  return dbEnum.replace(/(^(enum|set)\('|'\)$)/gi, '').split(`','`)
}

function enumNameFromColumn(dataType: string, columnName: string): string {
  return `${dataType}_${columnName}`
}

type EnumRecord = {
  column_name: string
  column_type: string
  data_type: string
}

type TableColumnType = {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  column_comment: string | null
  column_key: string | null
  extra: string | null
}

type TableType = {
  table_name: string
}

export type Enums = { [key: string]: string[] }

export async function query<T>(conn: Connection, sql: SQLStatement): Promise<T[]> {
  return new Promise((resolve, reject) => {
    conn.query(sql.sql, sql.values, (error: QueryError | null, results) => {
      if (error) {
        return reject(error)
      }
      return resolve(results as T[])
    })
  })
}

export class MySQL {
  private connection: Connection
  private defaultSchema: string

  constructor(connectionString: string) {
    this.connection = createConnection(connectionString)
    const database = urlParse(connectionString, true).pathname?.substr(1) || 'public'
    this.defaultSchema = database
  }

  public async table(tableName: string): Promise<Table> {
    const enumTypes = await this.enums(tableName)
    const table = await this.getTable(tableName, this.schema())
    return mapColumn(table, enumTypes)
  }

  public async allTables(): Promise<{ name: string; table: Table }[]> {
    const names = await this.tableNames()
    const nameMapping = names.map(async (name) => ({
      name,
      table: await this.table(name),
    }))

    return Promise.all(nameMapping)
  }

  private async tableNames(): Promise<string[]> {
    const schemaTables = await query<TableType>(
      this.connection,
      sql`SELECT table_name as table_name
       FROM information_schema.columns
       WHERE table_schema = ${this.schema()}
       GROUP BY table_name
      `
    )
    return schemaTables.map((schemaItem) => schemaItem.table_name)
  }

  public schema(): string {
    return this.defaultSchema
  }

  private async enums(tableName: string): Promise<Enums> {
    const enums: Enums = {}

    const rawEnumRecords = await query<EnumRecord>(
      this.connection,
      sql`SELECT column_name as column_name, column_type as column_type, data_type as data_type 
      FROM information_schema.columns 
      WHERE data_type IN ('enum', 'set')
      AND table_schema = ${this.schema()}
      AND table_name = ${tableName}`
    )

    rawEnumRecords.forEach((enumItem) => {
      const enumName = enumNameFromColumn(enumItem.data_type, enumItem.column_name)
      const enumValues = parseEnum(enumItem.column_type)
      enums[enumName] = enumValues
    })

    return enums
  }

  private async getTable(tableName: string, tableSchema: string): Promise<TableNonTsType> {
    const Table: TableNonTsType = {}

    const tableColumns = await query<TableColumnType>(
      this.connection,
      sql`SELECT
        ORDINAL_POSITION AS ordinal_position,
        COLUMN_NAME AS column_name,
        DATA_TYPE AS data_type,
        IS_NULLABLE AS is_nullable,
        COLUMN_DEFAULT AS column_default,
        COLUMN_COMMENT AS column_comment,
        COLUMN_KEY AS column_key,
        EXTRA AS extra
      FROM
        INFORMATION_SCHEMA.COLUMNS
      WHERE
       TABLE_NAME = ${tableName} 
       AND TABLE_SCHEMA = ${tableSchema}
      ORDER BY 
        ORDINAL_POSITION`
    )

    tableColumns.forEach((schemaItem) => {
      const columnName = schemaItem.column_name
      const dataType = schemaItem.data_type
      const isEnum = /^(enum|set)$/i.test(dataType)
      const nullable = schemaItem.is_nullable === 'YES'
      const defaultValue = schemaItem.column_default ?? (schemaItem.extra === 'auto_increment' ? schemaItem.extra : '')
      const hasDefault = Boolean(defaultValue)
      //console.log('TABLE:', tableName, schemaItem)
      Table[columnName] = {
        udtName: isEnum ? enumNameFromColumn(dataType, columnName) : dataType,
        comment: schemaItem.column_comment,
        defaultValue,
        hasDefault,
        nullable,
      }
    })

    return Table
  }
}