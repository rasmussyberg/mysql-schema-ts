import { existsSync, writeFileSync } from 'fs'
const { name, version } = require(`${__dirname}/../package.json`)
const pkg = require(`${__dirname}/../src/pkg`)

const targetFile = `${__dirname}/../dist/pkg.json`
if (existsSync(targetFile)) {
  writeFileSync(targetFile, JSON.stringify({ ...pkg, name, version }))
}
