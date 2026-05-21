export function parseHighlights(text) {
  if (!text) return []
  const blocks = text.split('==========').map(b => b.trim()).filter(Boolean)
  const results = []
  for (const b of blocks) {
    const lines = b.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) continue
    const title = lines[0]
    const highlights = []
    for (const line of lines.slice(1)) {
      if (line.startsWith('- ')) highlights.push(line.slice(2).trim())
      else highlights.push(line)
    }
    results.push({ title, highlights })
  }
  return results
}
