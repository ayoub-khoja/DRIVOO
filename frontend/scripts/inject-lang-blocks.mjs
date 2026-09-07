/**
 * Injects es / it / de language blocks into LocalizedStrings modules by cloning `en`.
 * Real translations are applied by follow-up passes; this keeps the switcher functional.
 *
 * Usage: node scripts/inject-lang-blocks.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const roots = [
  path.join(__dirname, '../src/lang'),
  path.join(__dirname, '../src/agency/lang'),
  path.join(__dirname, '../src/admin/lang'),
]

const TARGETS = ['es', 'it', 'de']

const extractBlock = (src, code) => {
  const marker = `${code}:`
  const startIdx = src.indexOf(marker)
  if (startIdx < 0) {
    return null
  }
  const braceStart = src.indexOf('{', startIdx)
  if (braceStart < 0) {
    return null
  }
  let depth = 0
  let i = braceStart
  for (; i < src.length; i += 1) {
    const ch = src[i]
    if (ch === '{') {
      depth += 1
    } else if (ch === '}') {
      depth -= 1
      if (depth === 0) {
        i += 1
        break
      }
    }
  }
  return { start: startIdx, end: i, body: src.slice(braceStart, i) }
}

const processFile = (filePath) => {
  let src = fs.readFileSync(filePath, 'utf8')
  if (!src.includes('LocalizedStrings') || !src.includes('en:')) {
    return false
  }

  const missing = TARGETS.filter((code) => !new RegExp(`\\b${code}\\s*:`).test(src))
  if (missing.length === 0) {
    return false
  }

  const en = extractBlock(src, 'en')
  if (!en) {
    console.warn('no en block', filePath)
    return false
  }

  // Prefer inserting after `ar` if present, else after `en`
  const ar = extractBlock(src, 'ar')
  const insertAt = ar ? ar.end : en.end

  // Skip trailing comma/whitespace already after insertAt
  let suffix = src.slice(insertAt)
  const needsCommaBefore = !src.slice(0, insertAt).trimEnd().endsWith(',')

  const blocks = missing.map((code) => {
    const body = en.body
    return `${needsCommaBefore || true ? ',' : ''}\n  ${code}: ${body}`
  }).join('')

  // Clean double commas
  let injection = blocks.replace(/^,/, ',')
  src = `${src.slice(0, insertAt)}${injection}${suffix}`

  // Normalize ",," artifacts
  src = src.replace(/,\s*,/g, ',')

  fs.writeFileSync(filePath, src, 'utf8')
  console.log('injected', missing.join(','), '→', path.relative(path.join(__dirname, '..'), filePath))
  return true
}

let count = 0
for (const root of roots) {
  if (!fs.existsSync(root)) {
    continue
  }
  for (const name of fs.readdirSync(root)) {
    if (!name.endsWith('.ts')) {
      continue
    }
    if (processFile(path.join(root, name))) {
      count += 1
    }
  }
}
console.log(`Done. Updated ${count} files.`)
