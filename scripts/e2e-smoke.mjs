import { spawn } from 'node:child_process'

const port = Number(process.env.E2E_PORT || 5199)
const host = '127.0.0.1'
const baseURL = `http://${host}:${port}`

const run = (cmd, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(cmd, args, { stdio: 'inherit', ...options })
  child.on('exit', code => {
    if (code === 0) resolve()
    else reject(new Error(`${cmd} ${args.join(' ')} exited with ${code}`))
  })
})

const waitForServer = async (url, timeoutMs = 20000) => {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // Vite is still starting.
    }
    await new Promise(resolve => setTimeout(resolve, 400))
  }
  throw new Error(`Dev server did not become ready at ${url}`)
}

const devServer = spawn('npm', ['run', 'dev', '--', '--host', host, '--port', String(port)], {
  env: { ...process.env, VITE_E2E_MODE: 'true' },
  stdio: ['ignore', 'pipe', 'pipe'],
})

devServer.stdout.on('data', chunk => process.stdout.write(chunk))
devServer.stderr.on('data', chunk => process.stderr.write(chunk))

const stopServer = () => {
  if (!devServer.killed) devServer.kill('SIGTERM')
}

process.on('SIGINT', () => {
  stopServer()
  process.exit(130)
})
process.on('SIGTERM', () => {
  stopServer()
  process.exit(143)
})

try {
  await waitForServer(baseURL)
  await run('npx', [
    'playwright',
    'test',
    'scripts/e2e-smoke.spec.mjs',
    '--reporter=line',
  ], {
    env: {
      ...process.env,
      E2E_BASE_URL: baseURL,
      PLAYWRIGHT_CHANNEL: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
    },
  })
} finally {
  stopServer()
}
