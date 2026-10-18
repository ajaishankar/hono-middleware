export type Cdn = 'specbook' | 'npm'

/** The `@specbook/ui` release the `npm` host loads unless `version` is given. */
export const TESTED_VERSION = '0.8.1'

const SPECBOOK_HOST = 'https://ui.specbook.dev'
const NPM_HOST = 'https://cdn.jsdelivr.net/npm'
const DEFAULT_CHANNEL = 'v1'

type ResourceConfig = {
  cdn?: Cdn
  /** Host, e.g. https://unpkg.com or an internal mirror */
  baseUrl?: string
  version?: string
  /** The full address of `specbook.js`, for a copy you serve yourself */
  src?: string
}

const trimSlash = (url: string) => url.replace(/\/+$/, '')

export const scriptUrl = ({ cdn = 'specbook', baseUrl, version, src }: ResourceConfig): string => {
  if (src !== undefined) {
    return src
  }
  if (cdn === 'npm') {
    return `${trimSlash(baseUrl ?? NPM_HOST)}/@specbook/ui@${version ?? TESTED_VERSION}/dist-viewer/specbook.js`
  }
  return `${trimSlash(baseUrl ?? SPECBOOK_HOST)}/${version ?? DEFAULT_CHANNEL}/specbook.js`
}
