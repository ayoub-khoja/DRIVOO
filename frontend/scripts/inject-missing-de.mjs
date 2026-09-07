/**
 * Inject missing `de` (or other) language blocks — only detects `code: {` at line starts
 * to avoid false positives like French "de :".
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const files = [
  path.join(__dirname, '../src/lang/cookie-policy.ts'),
  path.join(__dirname, '../src/agency/lang/agency.ts'),
]

const hasLang = (src, code) => new RegExp(`(?:^|\\n)\\s*${code}\\s*:\\s*\\{`).test(src)

const extractBlock = (src, code) => {
  const re = new RegExp(`(?:^|\\n)(\\s*)${code}\\s*:\\s*\\{`)
  const m = re.exec(src)
  if (!m) {
    return null
  }
  const braceStart = src.indexOf('{', m.index)
  let depth = 0
  let i = braceStart
  for (; i < src.length; i += 1) {
    if (src[i] === '{') {
      depth += 1
    } else if (src[i] === '}') {
      depth -= 1
      if (depth === 0) {
        i += 1
        break
      }
    }
  }
  return { end: i, body: src.slice(braceStart, i) }
}

for (const filePath of files) {
  let src = fs.readFileSync(filePath, 'utf8')
  if (hasLang(src, 'de')) {
    console.log('already has de', filePath)
    continue
  }
  const en = extractBlock(src, 'en')
  if (!en) {
    console.warn('no en', filePath)
    continue
  }
  const anchor = extractBlock(src, 'it') || extractBlock(src, 'es') || extractBlock(src, 'ar') || en
  const injection = `,\n  de: ${en.body}`
  src = `${src.slice(0, anchor.end)}${injection}${src.slice(anchor.end)}`
  src = src.replace(/,\s*,/g, ',')
  fs.writeFileSync(filePath, src, 'utf8')
  console.log('added de →', path.basename(filePath))
}
