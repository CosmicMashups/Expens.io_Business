#!/usr/bin/env node
/**
 * Entry point for Excel migration CLI. Requires tsx (devDependency).
 * See docs/IMPORT_RUNBOOK.md
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cli = path.join(__dirname, 'migrate-from-excel-cli.ts')
const args = process.argv.slice(2)

const r = spawnSync('npx', ['tsx', cli, ...args], {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '..'),
})

process.exit(r.status ?? 1)
