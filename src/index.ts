#!/usr/bin/env node
import { inferSchema, inferTable } from './table'
import meow from 'meow'
import config from './config'

const cli = meow(
  `
	Usage
	  $ mysql8-schema-ts <input>

	Options
    --table, -t                Table name
    --prefix, -p               Prefix to add to table names
    --tinyIntAsBoolean, -tb    Treat TinyInt as Boolean
    --binaryAsBuffer, -bb      Treat Binary as Buffer
    --nullAsUndefined, -nu     Treat null as undefined   

	Examples
	  $ mysql8-schema-ts --prefix SQL
`,
  {
    flags: {
      table: {
        type: 'string',
        alias: 't',
        default: '',
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
      nullAsUndefined: {
        type: 'boolean',
        alias: 'nu',
        default: false,
      },
    },
  }
)

const db = cli.input[0]
const { table, prefix, tinyIntAsBoolean, binaryAsBuffer, nullAsUndefined } = cli.flags

async function main(): Promise<string> {
  if (!db) {
    cli.showHelp()
  }
  console.error('bool', cli.flags)

  // Set the config from flags
  config.binaryAsBuffer = binaryAsBuffer
  config.tinyIntAsBoolean = tinyIntAsBoolean
  config.nullAsUndefined = nullAsUndefined

  if (cli.flags.table) {
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
