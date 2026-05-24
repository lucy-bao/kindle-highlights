function parseTitleLine(line) {
  const trimmed = line.trim()
  const englishParenIndex = trimmed.lastIndexOf(' (')
  const chineseParenIndex = trimmed.lastIndexOf(' （')
  const splitIndex = Math.max(englishParenIndex, chineseParenIndex)

  // Kindle 标题行通常是「书名 (作者)」，书名本身可能包含括号，所以从最后一组作者括号切分。
  if (splitIndex > -1 && /[)）]$/.test(trimmed)) {
    const title = trimmed.slice(0, splitIndex).trim()
    const author = trimmed
      .slice(splitIndex)
      .trim()
      .replace(/^[（(]/, '')
      .replace(/[）)]$/, '')
      .trim()

    return {
      title,
      author: author || '未知作者',
      rawTitle: trimmed,
    }
  }

  return {
    title: trimmed,
    author: '未知作者',
    rawTitle: trimmed,
  }
}

function parseMetaLine(line) {
  const page = line.match(/第\s*([^页]+)\s*页/)
  const location = line.match(/位置\s*#?([^)）\s]+)/)
  const addedAt = line.match(/添加于\s*(.*)$/)

  return {
    page: page?.[1]?.trim() || '',
    location: location?.[1]?.trim() || '',
    addedAt: addedAt?.[1]?.trim() || '',
    rawMeta: line.trim(),
  }
}

export function parseClippings(text) {
  if (!text) return []

  // 每条 clipping 以十个等号分隔，空行不参与解析。
  return text
    .split(/={10,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      const lines = block.split(/\r?\n/)
      const meaningful = lines.map((line) => line.trim()).filter(Boolean)
      if (meaningful.length < 3) return null

      const titleInfo = parseTitleLine(meaningful[0])
      const meta = parseMetaLine(meaningful[1])
      const content = meaningful.slice(2).join('\n').trim()
      if (!titleInfo.title || !content) return null

      return {
        id: `${titleInfo.rawTitle}-${meta.location || meta.page || index}-${content.slice(0, 24)}`,
        ...titleInfo,
        ...meta,
        content,
      }
    })
    .filter(Boolean)
}

export function groupByBook(highlights) {
  const books = new Map()

  highlights.forEach((highlight) => {
    const key = `${highlight.title}__${highlight.author}`
    const existing = books.get(key)

    if (existing) {
      existing.highlights.push(highlight)
      return
    }

    books.set(key, {
      id: key,
      title: highlight.title,
      author: highlight.author,
      highlights: [highlight],
    })
  })

  return Array.from(books.values()).sort((a, b) => b.highlights.length - a.highlights.length)
}
