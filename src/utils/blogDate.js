/**
 * Format a MySQL "YYYY-MM-DD HH:MM:SS" timestamp as a Slovak date.
 * The string is parsed manually — `new Date('YYYY-MM-DD HH:MM:SS')` is
 * invalid in some engines (Safari) and would render "Invalid Date".
 */
export function formatBlogDate(value) {
  if (!value || typeof value !== 'string') return ''
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return value
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return date.toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' })
}
