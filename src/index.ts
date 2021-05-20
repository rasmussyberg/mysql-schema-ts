#!/usr/bin/env node
import { inferSchema, inferTable } from './table'
import meow from 'meow'
import config from './config'

const cli = meow(
  `
	Usage
	  $ mysql8-schema-ts <input>

	Options
    --table, -t               Table name
    --prefix, -p              Prefix to add to table names
    --tinyIntAsBoolean, -b    Treat TinyInt as Boolean
    --binaryAsBuffer, -B      Treat Binary as Buffer
    --nullAsUndefined, -u     Treat null as undefined   
    --nullPlusUndefined, -p   Treat as null and undefined   

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
        alias: 'b',
        default: false,
      },
      binaryAsBuffer: {
        type: 'boolean',
        alias: 'B',
        default: false,
      },
      nullAsUndefined: {
        type: 'boolean',
        alias: 'u',
        default: false,
      },
      nullPlusUndefined: {
        type: 'boolean',
        alias: 'p',
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
