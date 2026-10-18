# Specbook UI Middleware and Component for Hono

This library, `@hono/specbook-ui`, serves the [Specbook UI](https://ui.specbook.dev) for an OpenAPI document from your Hono app. It reads the document in the browser and lets a visitor send each request: against **mock** responses built from the document's examples, or **live** against your API. It runs on your app's own origin, so there is no CORS to configure and the visitor's cookies are sent.

<img src="https://raw.githubusercontent.com/specbook-dev/specbook/main/.github/screenshot-pair.png" alt="Specbook with the Petstore spec open on a laptop and on a phone" width="840" />

See the [Specbook docs](https://docs.specbook.dev) for what else it can do: requests with checks, flows, tests that run in CI, and a portal for QA.

The middleware only returns HTML that loads the viewer, so it runs wherever Hono does: Node.js, Bun, Deno and Cloudflare Workers.

## Installation

```bash
npm install @hono/specbook-ui
# or
pnpm add @hono/specbook-ui
```

## Usage

### Middleware Usage

Use the `specbookUI` middleware to serve the viewer on a route of your Hono application:

```ts
import { Hono } from 'hono'
import { specbookUI } from '@hono/specbook-ui'

const app = new Hono()

// Serve the viewer at /ui for the OpenAPI document at /doc
app.get('/ui', specbookUI({ url: '/doc' }))

export default app
```

### Component Usage

`SpecbookUI` returns the viewer's markup as a string, so you can place it in a page of your own. The viewer takes over the page, so give it a page of its own:

```ts
import { Hono } from 'hono'
import { SpecbookUI } from '@hono/specbook-ui'

const app = new Hono()

app.get('/ui', (c) => {
  return c.html(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>My API</title>
      </head>
      <body>
        ${SpecbookUI({ url: '/doc' })}
      </body>
    </html>
  `)
})

export default app
```

### With `OpenAPIHono` Usage

With `@hono/zod-openapi` you can create the OpenAPI document and serve it with the viewer:

```ts
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { specbookUI } from '@hono/specbook-ui'

const app = new OpenAPIHono()

app.openapi(
  createRoute({
    method: 'get',
    path: '/hello',
    responses: {
      200: {
        description: 'Respond a message',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
      },
    },
  }),
  (c) => {
    return c.json({ message: 'hello' })
  }
)

// The OpenAPI document will be available at /doc
app.doc('/doc', {
  info: {
    title: 'An API',
    version: 'v1',
  },
  openapi: '3.1.0',
})

// The viewer will be available at /ui
app.get('/ui', specbookUI({ url: '/doc' }))

export default app
```

When the document lists no `servers`, live requests go to the page's own origin.

## Options

| Option       | Type                  | Default               | Description                                                                                                                      |
| ------------ | --------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `url`        | `string`              | (required)            | The OpenAPI document. A relative address is resolved against the page.                                                           |
| `title`      | `string`              | `API docs`            | The page title (middleware only). It is HTML-escaped.                                                                            |
| `defaultEnv` | `string`              | `mock`                | The environment shown first: `mock`, `live`, or the name of a server in the document.                                            |
| `apiUrl`     | `string`              | the page's own origin | Where live requests go when the document lists no server.                                                                        |
| `cdn`        | `'specbook' \| 'npm'` | `'specbook'`          | Where the viewer is loaded from: the stable `v1` channel at `ui.specbook.dev`, or `@specbook/ui` on jsDelivr.                    |
| `version`    | `string`              | `v1` / tested release | With `specbook`, the channel. With `npm`, a version or range of `@specbook/ui`. The default is the release this was tested with. |
| `baseUrl`    | `string`              | the host of `cdn`     | The host, for example `https://unpkg.com` or an internal mirror.                                                                 |
| `src`        | `string`              |                       | The full address of `specbook.js`, for a copy you serve yourself. It overrides `cdn`, `version` and `baseUrl`.                   |
| `nonce`      | `string`              |                       | A [CSP nonce](https://developer.mozilla.org/docs/Web/HTTP/CSP#nonces) for the viewer's script.                                   |

The viewer's own settings (`defaultEnv`, the page title, the Content-Security-Policy it needs) are described in the [embed reference](https://docs.specbook.dev/reference/embed/).

The `specbook` host is the newest deployed build of the `v1` line, so fixes reach your app without a new release of this package. A breaking change to the viewer would ship as `/v2/`. The `npm` host is an immutable release of `@specbook/ui`; pin `version` to hold it still.

## Content-Security-Policy

The page has no inline script. The JSON that configures the viewer is data, so it needs no nonce, and the one module script takes `nonce` when your policy uses nonces.

| Where the viewer comes from | The policy needs                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------- |
| A copy you serve (`src`)    | `script-src 'self'` and `worker-src 'self'`                                           |
| `ui.specbook.dev`           | that host in `script-src`, `style-src` and `worker-src`, plus `blob:` in `worker-src` |
| jsDelivr (`cdn: 'npm'`)     | `https://cdn.jsdelivr.net` in the same three directives, plus `blob:` in `worker-src` |

## Privacy

The viewer runs no analytics or tracking script, and your document and your API's responses stay in the visitor's browser; nothing is sent to Specbook. Loading the script from `ui.specbook.dev` or jsDelivr means that host sees the visitor's IP address and the file requests, as any CDN does; [serve the viewer yourself](#serving-the-viewer-yourself) to avoid that.

The overview shows a small "Powered by Specbook" link. It points to `docs.specbook.dev` with your site's hostname in the address, and the Specbook docs site uses Cloudflare Web Analytics.

## Serving the viewer yourself

`@specbook/ui` ships the viewer's files in `dist-viewer/` (MIT, with its third-party licence notices). Serve that folder from your app and point `src` at it, so nothing is loaded from another host. On Node.js:

```ts
import { serveStatic } from '@hono/node-server/serve-static'
import { specbookUI } from '@hono/specbook-ui'

app.use(
  '/specbook/*',
  serveStatic({
    root: './node_modules/@specbook/ui/dist-viewer',
    rewriteRequestPath: (path) => path.replace(/^\/specbook/, ''),
  })
)
app.get('/ui', specbookUI({ url: '/doc', src: '/specbook/specbook.js' }))
```

On Cloudflare Workers, put the folder in your static assets and point `src` at it.

## Author

Maintained by the [Specbook](https://github.com/specbook-dev/specbook) team.

## License

MIT
