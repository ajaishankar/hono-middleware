import { Hono } from 'hono'
import { SpecbookUI, specbookUI } from '.'

const get = async (options: Parameters<typeof specbookUI>[0], path = '/ui') => {
  const app = new Hono().get(path, specbookUI(options))
  return app.request(path)
}

type Config = { spec?: string; baseUrl?: string; defaultEnv?: string }

const config = (html: string): Config => {
  const m = /<script type="application\/json" id="specbook-config">(.*?)<\/script>/s.exec(html)
  return JSON.parse(m?.[1] ?? 'null') as Config
}

describe('specbookUI', () => {
  it('serves an HTML page with the embed', async () => {
    const res = await get({ url: '/doc' })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/^text\/html/)
    const html = await res.text()
    expect(html).toContain('<!doctype html>')
    expect(html).toContain('<div id="app"></div>')
    expect(html).toContain('<title>API docs</title>')
    expect(config(html)).toEqual({ spec: '/doc' })
    expect(html).toContain(
      '<script type="module" src="https://ui.specbook.dev/v1/specbook.js"></script>'
    )
  })

  it('has no executable inline script', async () => {
    const html = await (await get({ url: '/doc' })).text()
    const scripts = [...html.matchAll(/<script\b([^>]*)>/g)].map((m) => m[1] ?? '')
    for (const attrs of scripts) {
      expect(attrs).toMatch(/type="application\/json"|src=/)
    }
  })

  it('escapes the title', async () => {
    const html = await (
      await get({ url: '/doc', title: '</title><script>alert(1)</script>' })
    ).text()
    expect(html).not.toContain('<script>alert(1)')
    expect(html).toContain('<title>&lt;/title&gt;&lt;script&gt;alert(1)&lt;/script&gt;</title>')
  })

  it('cannot be closed early through the spec address', async () => {
    const url = '/doc"></script><script>alert(1)</script>&\u2028'
    const html = await (await get({ url })).text()
    expect(html).not.toContain('<script>alert(1)')
    expect(config(html).spec).toBe(url)
  })

  it('passes apiUrl and defaultEnv to the viewer', async () => {
    const html = await (
      await get({ url: '/doc', apiUrl: 'https://api.example.com', defaultEnv: 'live' })
    ).text()
    expect(config(html)).toEqual({
      spec: '/doc',
      baseUrl: 'https://api.example.com',
      defaultEnv: 'live',
    })
  })

  it('puts a nonce on the module script only, escaped', async () => {
    const html = await (await get({ url: '/doc', nonce: 'a"b' })).text()
    expect(html).toContain('src="https://ui.specbook.dev/v1/specbook.js" nonce="a&quot;b"')
    expect(html).not.toMatch(/application\/json"[^>]*nonce/)
  })
})

describe('SpecbookUI', () => {
  it('returns the fragment for a custom page', () => {
    const html = SpecbookUI({ url: '/doc' })
    expect(html).not.toContain('<html')
    expect(html.split('\n')).toHaveLength(3)
    expect(html).toContain('id="specbook-config"')
  })
})
