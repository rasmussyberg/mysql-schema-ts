#!/usr/bin/env node
import { inferSchema, inferTable } from './table'
import meow from 'meow'

const cli = meow(
  `
	Usage
	  $ mysql-schema-ts <input>

	Options
    --table, -t                Table name
    --prefix, -p               Prefix to add to table names
    --tinyIntAsBoolean -tb     Treat TinyInt as Boolean
    --binaryAsBuffer -bb       Treat Binary as Buffer

	Examples
	  $ mysql-schema-ts --prefix SQL
`,
  {
    flags: {
      table: {
        type: 'string',
        alias: 't',
      },
      prefix: {
        type: 'string',
        alias: 'p',
        default: '',
      },
      tinyIntAsBoolean: {
        type: 'boolean',
        alias: 'tb',
        default: false,
      },
      binaryAsBuffer: {
        type: 'boolean',
        alias: 'bb',
        default: false,
      },
    },
  }
)

const db = cli.input[0]
const { table, prefix, tinyIntAsBoolean, binaryAsBuffer } = cli.flags

async function main(): Promise<string> {
  if (!db) {
    cli.showHelp()
  }
  console.error('bool', cli.flags)
  process.env.BINARY_AS_BUFFER = binaryAsBuffer.toString()
  process.env.TINYINT_AS_BOOLEAN = tinyIntAsBoolean.toString()
  if (table) {
    return inferTable(db, table, prefix)
  }

  return inferSchema(db, prefix)
}

main()
  .then((code) => {
    process.stdout.write(code)
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
