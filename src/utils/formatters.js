export function compactTitle(title) {
  return title.replace(/[（(].*?[）)]/g, '').slice(0, 16) || title.slice(0, 16)
}

export function locationText(item) {
  if (item.page && item.location) return `第 ${item.page} 页 · 位置 ${item.location}`
  if (item.page) return `第 ${item.page} 页`
  if (item.location) return `位置 ${item.location}`
  return item.addedAt || 'Kindle 标注'
}

export function pageText(item) {
  if (item.page) return `第${item.page}页`
  if (item.location) return `位置${item.location}`
  return '页数未知'
}

export function clippingDateText(item) {
  const date = parseKindleDate(item.addedAt)
  if (!date) return item.addedAt || '日期未知'

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function clippingTimeValue(item) {
  return parseKindleDate(item.addedAt)?.getTime() || 0
}

function parseKindleDate(text = '') {
  const match = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
  if (!match) return null

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}
