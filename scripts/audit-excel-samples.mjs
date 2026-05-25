import pkg from 'xlsx'
const { readFile, utils } = pkg
import fs from 'fs'
import path from 'path'

const dir = path.join(process.cwd(), 'src/assets/sample')
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.xlsx'))

for (const file of files) {
  console.log('\n===', file, '===')
  const wb = readFile(path.join(dir, file), { cellDates: true })
  console.log('Sheets:', wb.SheetNames.join(', '))
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = utils.sheet_to_json(ws, { header: 1, defval: null })
  console.log('Rows:', rows.length)
  if (rows[0]) console.log('Row1:', rows[0].slice(0, 10))
}

console.log('\nAudit complete.')
