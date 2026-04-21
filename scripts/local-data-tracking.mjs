import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const mode = process.argv[2]
const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
const excludePath = path.join(repoRoot, '.git', 'info', 'exclude')
const blockStart = '# BEGIN not-msn-tv local generated data'
const blockEnd = '# END not-msn-tv local generated data'
const excludeBlock = `${blockStart}
/public/data/**/*.json
${blockEnd}`

function getTrackedDataJsonFiles() {
  const output = execFileSync('git', ['ls-files', '-z', '--', 'public/data'], {
    cwd: repoRoot,
    encoding: 'buffer',
  })

  return output
    .toString('utf8')
    .split('\0')
    .filter((file) => file.endsWith('.json'))
}

function updateIndex(files, flag) {
  for (let index = 0; index < files.length; index += 100) {
    const chunk = files.slice(index, index + 100)
    execFileSync('git', ['update-index', flag, '--', ...chunk], { cwd: repoRoot })
  }
}

function setLocalExclude(enabled) {
  const existing = fs.existsSync(excludePath) ? fs.readFileSync(excludePath, 'utf8') : ''
  const blockPattern = new RegExp(`\\n?${blockStart}[\\s\\S]*?${blockEnd}\\n?`, 'g')
  const withoutBlock = existing.replace(blockPattern, '\n').replace(/\n{3,}/g, '\n\n').trimEnd()

  if (!enabled) {
    fs.writeFileSync(excludePath, withoutBlock ? `${withoutBlock}\n` : '')
    return
  }

  fs.writeFileSync(excludePath, `${withoutBlock ? `${withoutBlock}\n\n` : ''}${excludeBlock}\n`)
}

if (!['ignore', 'track'].includes(mode)) {
  console.error('Usage: node scripts/local-data-tracking.mjs <ignore|track>')
  process.exit(1)
}

const files = getTrackedDataJsonFiles()

if (mode === 'ignore') {
  updateIndex(files, '--skip-worktree')
  setLocalExclude(true)
} else {
  updateIndex(files, '--no-skip-worktree')
  setLocalExclude(false)
}
