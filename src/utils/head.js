/**
 * Keeps the document head honest while the router moves around.
 *
 * The authoritative head is built on the server (api/_lib/seo.php +
 * api/seo/render.php) and arrives in the HTML, which is what crawlers and
 * social scrapers read. But a client-side route change does not fetch a new
 * document: without this module the tab title, the canonical link and the
 * Open Graph tags would still describe whichever page the visitor first
 * landed on, for the whole session.
 *
 * So this is the second half of the same job. Both halves emit the same tags
 * from the same facts, and a page whose data has not arrived yet simply keeps
 * what the server sent rather than flashing a placeholder.
 */

const ORIGIN = 'https://aktivity.ceaeurope.sk'
const SITE_NAME = 'AKTIVITY DW KLUB'
const FALLBACK_IMAGE = `${ORIGIN}/assets/icons/aktivity-dw-logo.png`
const TITLE_MAX = 65
const DESCRIPTION_MAX = 160

/** Marks the elements this module owns, so it can replace exactly those. */
const OWNED = 'data-spa-head'

/** Relative path → absolute URL. Absolute input passes through. */
export function absoluteUrl(path) {
  if (!path) return `${ORIGIN}/`
  if (/^https?:\/\//i.test(path)) return path
  return `${ORIGIN}/${String(path).replace(/^\/+/, '')}`
}

/** Collapse whitespace, strip tags, cut on a word boundary. */
export function summarize(text, max = DESCRIPTION_MAX) {
  const clean = String(text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:-]+$/, '')}…`
}

/** Append the brand only while the whole title still fits in a search result. */
export function brandedTitle(title) {
  const clean = String(title || '').replace(/\s+/g, ' ').trim()
  if (!clean) return SITE_NAME
  if (clean.includes(SITE_NAME)) return clean
  const withBrand = `${clean} | ${SITE_NAME}`
  return withBrand.length > TITLE_MAX ? clean : withBrand
}

function upsertMeta(selector, attr, name, content) {
  if (!content) return
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    el.setAttribute(OWNED, '')
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/**
 * Apply a head.
 *
 * @param {object}   meta
 * @param {string}   meta.title        page title, brand appended if it fits
 * @param {string}   meta.description  meta description and og/twitter copy
 * @param {string}   meta.path         route path; becomes the canonical URL
 * @param {string}  [meta.image]       social card image, relative or absolute
 * @param {string}  [meta.type]        og:type, 'website' (default) or 'article'
 * @param {boolean} [meta.noindex]     keep the page out of the index
 * @param {object[]}[meta.jsonld]      schema.org nodes for the @graph
 */
export function setHead(meta = {}) {
  if (typeof document === 'undefined') return

  const title = brandedTitle(meta.title)
  const description = summarize(meta.description)
  const canonical = absoluteUrl(meta.path)
  const image = absoluteUrl(meta.image || FALLBACK_IMAGE)
  const type = meta.type || 'website'
  const robots = meta.noindex
    ? 'noindex, nofollow'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'

  document.title = title

  upsertMeta('meta[name="description"]', 'name', 'description', description)
  upsertMeta('meta[name="robots"]', 'name', 'robots', robots)

  upsertMeta('meta[property="og:type"]', 'property', 'og:type', type)
  upsertMeta('meta[property="og:site_name"]', 'property', 'og:site_name', SITE_NAME)
  upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonical)
  upsertMeta('meta[property="og:title"]', 'property', 'og:title', title)
  upsertMeta('meta[property="og:description"]', 'property', 'og:description', description)
  upsertMeta('meta[property="og:image"]', 'property', 'og:image', image)

  upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
  upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title)
  upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
  upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image)

  // The single most consequential tag on the page. index.html ships with this
  // pointing at "/" — leaving it there is what made Google treat every trail
  // page as a duplicate of the home page.
  let link = document.head.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', canonical)

  setJsonLd(meta.jsonld)
}

/**
 * Replace the structured data. The server writes one @graph; so does this, so
 * a client-side navigation swaps the whole block rather than layering a
 * second, contradictory one underneath.
 */
function setJsonLd(nodes) {
  const previous = document.head.querySelectorAll(`script[type="application/ld+json"][${OWNED}]`)
  previous.forEach((el) => el.remove())

  // The server-rendered graph describes the landing page, not this one. Once
  // the router has moved, it is stale and has to go — but only then, so a
  // crawler that never runs the router still sees it.
  const serverGraph = document.head.querySelector(`script[type="application/ld+json"]:not([${OWNED}])`)
  if (serverGraph) serverGraph.remove()

  if (!nodes || !nodes.length) return

  const el = document.createElement('script')
  el.setAttribute('type', 'application/ld+json')
  el.setAttribute(OWNED, '')
  el.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes })
  document.head.appendChild(el)
}

/** The Organization node every page's publisher points at. */
export function organizationNode() {
  return {
    '@type': 'Organization',
    '@id': `${ORIGIN}/#organization`,
    name: SITE_NAME,
    url: `${ORIGIN}/`,
    logo: { '@type': 'ImageObject', url: FALLBACK_IMAGE },
    areaServed: { '@type': 'Country', name: 'Slovensko' }
  }
}

/** BreadcrumbList from [[label, path], …], home first. */
export function breadcrumbNode(crumbs) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: absoluteUrl(path)
    }))
  }
}

export { ORIGIN, SITE_NAME, FALLBACK_IMAGE }
