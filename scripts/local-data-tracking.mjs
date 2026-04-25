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
  const unmerged = execFileSync('git', ['ls-files', '-z', '--unmerged', '--', 'public/data'], {
    cwd: repoRoot,
    encoding: 'buffer',
  })
    .toString('utf8')
    .split('\0')
    .filter(Boolean)

  if (unmerged.length > 0) {
    throw new Error('public/data has unresolved merge conflicts. Resolve or accept the generated data version before running data:local-ignore.')
  }

  const output = execFileSync('git', ['ls-files', '-z', '--', 'public/data'], {
    cwd: repoRoot,
    encoding: 'buffer',
  })

  return [...new Set(
    output
      .toString('utf8')
      .split('\0')
      .filter((file) => file.endsWith('.json')),
  )]
}

function getLocalDataJsonFiles(directory = path.join(repoRoot, 'public', 'data')) {
  if (!fs.existsSync(directory)) return []

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) return getLocalDataJsonFiles(entryPath)
    if (!entry.isFile() || !entry.name.endsWith('.json')) return []

    return [path.relative(repoRoot, entryPath)]
  })
}

function updateIndex(files, flag) {
  for (let index = 0; index < files.length; index += 100) {
    const chunk = files.slice(index, index + 100)
    execFileSync('git', ['update-index', flag, '--', ...chunk], { cwd: repoRoot })
  }
}

function addFiles(files) {
  for (let index = 0; index < files.length; index += 100) {
    const chunk = files.slice(index, index + 100)
    execFileSync('git', ['add', '--force', '--', ...chunk], { cwd: repoRoot })
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
  setLocalExclude(false)
  addFiles(getLocalDataJsonFiles())
  updateIndex(getTrackedDataJsonFiles(), '--no-skip-worktree')
}
