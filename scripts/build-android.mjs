/**
 * build-android.mjs
 * Android build script: temporarily hides API routes (which use Prisma/Node.js 
 * and can't be exported as static pages) before running next build with output: 'export',
 * then restores them afterwards.
 * 
 * NOTE: Stop 'npm run dev' before running this script (Windows locks files)
 */

import { renameSync, existsSync, mkdirSync, cpSync, rmSync } from 'fs'
import { execSync } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const apiDir = join(root, 'src', 'app', 'api')
const apiBackup = join(root, 'src', '_api_backup')

let moved = false

function restore() {
  if (moved && existsSync(apiBackup)) {
    try {
      // If api dir was created (shouldn't be), remove it
      if (existsSync(apiDir)) rmSync(apiDir, { recursive: true })
      // Use execSync with robocopy for Windows reliability
      execSync(`xcopy "${apiBackup}" "${apiDir}" /E /I /Q`, { stdio: 'ignore' })
      rmSync(apiBackup, { recursive: true })
      console.log('✅ Restored src/app/api/')
    } catch (e) {
      console.error('⚠️  Failed to restore api folder:', e.message)
      console.error(`   Manual restore: copy ${apiBackup} to ${apiDir}`)
    }
  }
}

process.on('exit', restore)
process.on('SIGINT', () => { restore(); process.exit(1) })
process.on('uncaughtException', (e) => { console.error(e); restore(); process.exit(1) })

try {
  // Step 1: Copy API to backup, then delete original
  if (existsSync(apiDir)) {
    console.log('🔄 Temporarily hiding src/app/api/ for static export...')
    if (existsSync(apiBackup)) rmSync(apiBackup, { recursive: true })
    cpSync(apiDir, apiBackup, { recursive: true })
    rmSync(apiDir, { recursive: true, force: true })
    moved = true
    console.log('   ✓ API folder hidden')
  }

  // Step 2: Build
  console.log('🏗️  Running Next.js static export build...')
  execSync('npx cross-env BUILD_TARGET=android npx next build', {
    stdio: 'inherit',
    cwd: root,
  })

  console.log('🎉 Android build successful! Output in ./out/')
  console.log('   Next step: npm run android:sync')
} catch (err) {
  console.error('❌ Build failed:', err.message)
  process.exitCode = 1
}
// restore() called by process.on('exit')
