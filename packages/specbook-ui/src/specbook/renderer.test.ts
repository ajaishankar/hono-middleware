import { escapeHtml, jsonForScript, renderEmbed } from './renderer'

describe('escapeHtml', () => {
  it('escapes the five characters', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;'
    )
  })
})

describe('jsonForScript', () => {
  it('leaves nothing that can close a script element', () => {
    const out = jsonForScript({ a: '</script><!--', b: '&', c: '\u2028\u2029' })
    expect(out).not.toMatch(/[<>&\u2028\u2029]/)
    expect(JSON.parse(out)).toEqual({ a: '</script><!--', b: '&', c: '\u2028\u2029' })
  })
})

describe('renderEmbed', () => {
  it('writes the container, the config and the module script', () => {
    expect(renderEmbed({ spec: '/doc' }, '/s.js')).toBe(
      '<div id="app"></div>\n' +
        '<script type="application/json" id="specbook-config">{"spec":"/doc"}</script>\n' +
        '<script type="module" src="/s.js"></script>'
    )
  })
})
