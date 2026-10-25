// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { createServer } from 'vite-plus'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('development tooling', () => {
  it('compiles the Vue Inspector overlay imported by DevTools', async () => {
    // Inspector is disabled under NODE_ENV=test, so use the actual dev configuration.
    vi.stubEnv('NODE_ENV', 'development')
    const server = await createServer({
      logLevel: 'silent',
      server: { middlewareMode: true, hmr: false },
    })

    try {
      const loader = await server.transformRequest('virtual:vue-inspector-path:load.js')
      const overlayUrl = loader?.code.match(/import App from ["']([^"']+)["']/)?.[1]
      expect(overlayUrl).toBeDefined()

      const overlay = await server.transformRequest(overlayUrl!)
      expect(overlay).not.toBeNull()
      expect(overlay?.code).not.toContain('</script>')
      expect(overlay?.code).not.toContain('</template>')
    } finally {
      await server.close()
    }
  }, 30_000)
})
