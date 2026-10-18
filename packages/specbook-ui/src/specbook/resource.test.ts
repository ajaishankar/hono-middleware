import { TESTED_VERSION, scriptUrl } from './resource'

describe('scriptUrl', () => {
  it('defaults to the v1 channel at ui.specbook.dev', () => {
    expect(scriptUrl({})).toBe('https://ui.specbook.dev/v1/specbook.js')
    expect(scriptUrl({ cdn: 'specbook' })).toBe('https://ui.specbook.dev/v1/specbook.js')
  })

  it('takes a channel, and a mirror for the host', () => {
    expect(scriptUrl({ version: 'v2' })).toBe('https://ui.specbook.dev/v2/specbook.js')
    expect(scriptUrl({ baseUrl: 'https://mirror.test/' })).toBe(
      'https://mirror.test/v1/specbook.js'
    )
  })

  it('loads @specbook/ui from jsDelivr with cdn: npm, at the tested version', () => {
    expect(TESTED_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
    expect(scriptUrl({ cdn: 'npm' })).toBe(
      `https://cdn.jsdelivr.net/npm/@specbook/ui@${TESTED_VERSION}/dist-viewer/specbook.js`
    )
  })

  it('takes an npm version, a range, and another npm CDN', () => {
    expect(scriptUrl({ cdn: 'npm', version: '0.5.1' })).toBe(
      'https://cdn.jsdelivr.net/npm/@specbook/ui@0.5.1/dist-viewer/specbook.js'
    )
    expect(scriptUrl({ cdn: 'npm', version: 'latest', baseUrl: 'https://unpkg.com//' })).toBe(
      'https://unpkg.com/@specbook/ui@latest/dist-viewer/specbook.js'
    )
  })

  it('lets src beat everything', () => {
    expect(
      scriptUrl({
        src: '/specbook/specbook.js',
        cdn: 'npm',
        baseUrl: 'https://x.test',
        version: '9',
      })
    ).toBe('/specbook/specbook.js')
  })
})
