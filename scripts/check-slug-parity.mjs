// Check the browser-side slug against scripts/slug-fixtures.json.
//
//   node scripts/check-slug-parity.mjs
//
// Its PHP twin, check-slug-parity.php, runs the same fixtures against
// api/_lib/slug.php on the server. Both must pass: the browser picks the
// upload folder and the server picks the database id, and a disagreement
// silently orphans files.

import { readFile } from 'node:fs/promises'
import { getStorageTrailId } from '../src/utils/slug.js'

const { cases } = JSON.parse(
  await readFile(new URL('./slug-fixtures.json', import.meta.url), 'utf8')
)

let failed = 0
for (const [input, expected] of cases) {
  const actual = getStorageTrailId(input)
  const ok = actual === expected
  if (!ok) failed++
  console.log(
    `${ok ? 'ok  ' : 'FAIL'}  ${JSON.stringify(input).padEnd(24)} -> ${JSON.stringify(actual)}${
      ok ? '' : `   expected ${JSON.stringify(expected)}`
    }`
  )
}

console.log(`\n${cases.length - failed}/${cases.length} passed`)
process.exit(failed ? 1 : 0)
