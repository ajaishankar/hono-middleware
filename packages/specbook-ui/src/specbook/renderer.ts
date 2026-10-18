const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c)

/** JSON that is safe inside a `<script>` element: nothing in it can close the element or start a comment. */
export const jsonForScript = (value: unknown): string =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')

export type EmbedConfig = {
  spec: string
  baseUrl?: string
  defaultEnv?: string
}

export const renderEmbed = (config: EmbedConfig, src: string, nonce?: string): string => {
  const nonceAttr = nonce === undefined ? '' : ` nonce="${escapeHtml(nonce)}"`
  return [
    '<div id="app"></div>',
    `<script type="application/json" id="specbook-config">${jsonForScript(config)}</script>`,
    `<script type="module" src="${escapeHtml(src)}"${nonceAttr}></script>`,
  ].join('\n')
}
