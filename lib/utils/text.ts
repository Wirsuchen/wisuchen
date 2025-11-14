export function decodeHtmlEntities(input: string): string {
  if (!input) return ''
  const map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
  }
  return input.replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (m) => map[m] || m)
}

export function stripHtmlToText(html: string): string {
  if (!html) return ''
  // Replace tags with a space to avoid word concatenation like "in<b>it</b>" -> "init"
  const noTags = html.replace(/<[^>]+>/g, ' ')
  // Decode common entities
  const decoded = decodeHtmlEntities(noTags)
  // Collapse whitespace
  return decoded.replace(/\s+/g, ' ').trim()
}

export function sanitizeSnippet(text: string | null | undefined, maxLen = 240): string | null {
  if (!text) return null
  const clean = stripHtmlToText(String(text))
  if (clean.length <= maxLen) return clean
  // Cut on word boundary if possible
  const cut = clean.slice(0, maxLen)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 140 ? cut.slice(0, lastSpace) : cut).trim() + '…'
}
