import type { Env, MiddlewareHandler } from 'hono'
import type { EmbedConfig } from './specbook/renderer'
import { escapeHtml, renderEmbed } from './specbook/renderer'
import type { Cdn } from './specbook/resource'
import { scriptUrl } from './specbook/resource'

type SpecbookUIOptions = {
  /** The OpenAPI document. A relative address is resolved against the page. */
  url: string
  /** Page title. Default: `API docs` */
  title?: string
  /**
   * Where the viewer is loaded from. `specbook` (default) is the stable `v1` channel at ui.specbook.dev;
   * `npm` is `@specbook/ui` on jsDelivr.
   */
  cdn?: Cdn
  /**
   * With `specbook`, the channel (default `v1`). With `npm`, a version or range of `@specbook/ui`
   * (default: the release this middleware was tested with).
   */
  version?: string
  /** Host, e.g. https://unpkg.com or an internal mirror */
  baseUrl?: string
  /** The full address of `specbook.js`, for a copy you serve yourself. Overrides `cdn`, `baseUrl` and `version`. */
  src?: string
  /** The API address, when the document lists no server. Default: the page's own origin. */
  apiUrl?: string
  /** The environment shown first: `mock` (default), `live`, or the name of a server in the document. */
  defaultEnv?: string
  /** A CSP nonce for the viewer's script */
  nonce?: string
}

const SpecbookUI = ({
  url,
  cdn,
  version,
  baseUrl,
  src,
  apiUrl,
  defaultEnv,
  nonce,
}: SpecbookUIOptions): string => {
  const config: EmbedConfig = { spec: url }
  if (apiUrl !== undefined) {
    config.baseUrl = apiUrl
  }
  if (defaultEnv !== undefined) {
    config.defaultEnv = defaultEnv
  }
  return renderEmbed(config, scriptUrl({ cdn, baseUrl, version, src }), nonce)
}

const middleware =
  <E extends Env>(options: SpecbookUIOptions): MiddlewareHandler<E> =>
  (c) => {
    const title = escapeHtml(options.title ?? 'API docs')
    return Promise.resolve(
      c.html(/* html */ `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body>
${SpecbookUI(options)}
  </body>
</html>
`)
    )
  }

export { middleware as specbookUI, SpecbookUI }
export type { SpecbookUIOptions }
