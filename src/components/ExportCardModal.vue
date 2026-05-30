<template>
  <div class="card-modal" @click.self="$emit('close')">
    <section class="card-designer" aria-label="导出卡片">
      <button class="card-close" aria-label="关闭" @click="$emit('close')">
        <img :src="closeIcon" alt="" />
      </button>

      <div class="card-tabs" role="tablist" aria-label="卡片样式">
        <button :class="{ active: selectedStyle === 'classic' }" @click="selectedStyle = 'classic'">经典</button>
        <button :class="{ active: selectedStyle === 'tech' }" @click="selectedStyle = 'tech'">科技</button>
        <button :class="{ active: selectedStyle === 'vintage' }" @click="selectedStyle = 'vintage'">复古</button>
        <button :class="{ active: selectedStyle === 'cute' }" @click="selectedStyle = 'cute'">可爱</button>
        <button :class="{ active: selectedStyle === 'pixel' }" @click="selectedStyle = 'pixel'">像素</button>
      </div>

      <div class="share-card-preview">
        <ClassicShareCard :item="item" :style-type="selectedStyle" />
      </div>

      <button class="download-full" @click="downloadCard">导出完整图片</button>
    </section>

  </div>
</template>

<script setup>
import { nextTick, ref } from 'vue'
import ClassicShareCard from './cards/ClassicShareCard.vue'
import closeIcon from '../assets/images/close-solid.svg'
import achievementBadge from '../assets/images/achievement-badge.png'
import emailStamp from '../assets/images/email.png'
import waveFooter from '../assets/images/compiled_wave_illustration.svg'
import { clippingDateText } from '../utils/formatters'

const props = defineProps({
  item: { type: Object, required: true },
})

defineEmits(['close'])

const selectedStyle = ref('classic')

async function downloadCard() {
  const style = exportStyles[selectedStyle.value]
  await loadExportFonts(style)
  await nextTick()
  const width = 1626
  const paddingX = 118
  const paddingTop = 76
  const paddingBottom = 48
  const quoteFont = style.quoteFont
  const metaFont = style.metaFont
  const quoteLineHeight = 80
  const metaLineHeight = 54
  const reservedTop = style.reservedTop || 0
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const quoteLines = wrapText(ctx, props.item.content, width - paddingX * 2, quoteFont)
  const bookLines = wrapText(ctx, props.item.title, 1180, metaFont)
  const contentHeight = quoteLines.length * quoteLineHeight + 54 + bookLines.length * metaLineHeight + metaLineHeight * 2
  const height = Math.max(
    746,
    paddingTop + reservedTop + contentHeight + paddingBottom,
  )
  const availableTop = paddingTop + reservedTop
  const startY = Math.max(availableTop, availableTop + (height - availableTop - paddingBottom - contentHeight) / 2)
  const scale = 2

  canvas.width = width * scale
  canvas.height = height * scale
  ctx.scale(scale, scale)
  ctx.fillStyle = style.background
  ctx.fillRect(0, 0, width, height)
  if (style.achievement) {
    await drawAchievement(ctx).catch(() => {})
  }
  if (style.footer) {
    await drawWaveFooter(ctx, width, height).catch(() => {})
  }

  ctx.fillStyle = style.quote
  ctx.font = quoteFont
  ctx.textBaseline = 'top'
  drawLines(ctx, quoteLines, paddingX, startY, quoteLineHeight)

  let y = startY + quoteLines.length * quoteLineHeight + 54
  ctx.fillStyle = style.book
  ctx.font = metaFont
  drawLines(ctx, bookLines, paddingX, y, metaLineHeight)

  y += bookLines.length * metaLineHeight
  ctx.fillStyle = style.secondary
  ctx.fillText(props.item.author, paddingX, y)

  if (style.stamp) {
    await drawStamp(ctx, width, height, clippingDateText(props.item).replaceAll('-', '/')).catch(() => {
      ctx.fillText(clippingDateText(props.item).replaceAll('-', '/'), paddingX, y + metaLineHeight)
    })
  } else {
    ctx.fillText(clippingDateText(props.item).replaceAll('-', '/'), paddingX, y + metaLineHeight)
  }

  await downloadCanvas(canvas)
}

async function downloadCanvas(canvas) {
  const link = document.createElement('a')
  link.download = `kindle-highlight-${Date.now()}.png`
  link.href = await canvasToDataUrl(canvas)
  document.body.appendChild(link)
  link.click()
  link.remove()
}

function canvasToDataUrl(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(canvas.toDataURL('image/png'))
        return
      }

      resolve(URL.createObjectURL(blob))
    }, 'image/png')
  })
}

const exportStyles = {
  classic: {
    background: '#fff',
    book: '#1b1b1b',
    metaFont: '32px "Songti SC", SimSun, STSong, serif',
    quote: '#111',
    quoteFont: '54px "Songti SC", SimSun, STSong, serif',
    secondary: '#a0a0a0',
  },
  tech: {
    background: '#000',
    book: '#00e083',
    metaFont: '32px "Songti SC", SimSun, STSong, serif',
    quote: '#00e083',
    quoteFont: '54px "Songti SC", SimSun, STSong, serif',
    secondary: '#f2f2f2',
  },
  vintage: {
    background: '#f4ecd9',
    book: '#111',
    metaFont: '32px "HuiwenMingchaoGBK", MingLiU, "Songti SC", SimSun, STSong, serif',
    quote: '#000',
    quoteFont: '54px "HuiwenMingchaoGBK", MingLiU, "Songti SC", SimSun, STSong, serif',
    secondary: '#a5a5a5',
    stamp: true,
  },
  cute: {
    background: '#F7F3DF',
    book: '#6B5C43',
    metaFont: '32px "JiangchengYuanti600", "Songti SC", SimSun, STSong, serif',
    quote: '#6B5C43',
    quoteFont: '54px "JiangchengYuanti600", "Songti SC", SimSun, STSong, serif',
    secondary: '#6B5C43',
    footer: true,
  },
  pixel: {
    achievement: true,
    background: '#FFD384',
    book: '#4C1D19',
    metaFont: '32px "BaDingShiWeiTi16", "Songti SC", SimSun, STSong, serif',
    quote: '#4C1D19',
    quoteFont: '54px "BaDingShiWeiTi16", "Songti SC", SimSun, STSong, serif',
    secondary: '#fff',
    reservedTop: 78,
  },
}

const exportFontLoads = {
  BaDingShiWeiTi16: '54px "BaDingShiWeiTi16"',
  HuiwenMingchaoGBK: '54px "HuiwenMingchaoGBK"',
  JiangchengYuanti600: '54px "JiangchengYuanti600"',
}

function wrapText(ctx, text = '', maxWidth, font) {
  ctx.font = font
  const lines = []

  text.split(/\r?\n/).forEach((paragraph) => {
    if (!paragraph) {
      lines.push('')
      return
    }

    let line = ''
    Array.from(paragraph).forEach((char) => {
      const next = line + char
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line)
        line = char
        return
      }

      line = next
    })

    lines.push(line)
  })

  return lines
}

function drawLines(ctx, lines, x, y, lineHeight) {
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight)
  })
}

async function drawStamp(ctx, width, height, displayDate) {
  const image = await loadImage(emailStamp)
  const size = 210
  const x = width - 118 - size
  const y = height - 72 - size
  const [year, month, day] = displayDate.split('/')

  ctx.drawImage(image, x, y, size, size)
  ctx.save()
  ctx.translate(x + size / 2, y + size / 2)
  ctx.rotate(-0.16)
  ctx.fillStyle = '#8b0000'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '700 34px "HuiwenMingchaoGBK", MingLiU, serif'
  ctx.fillText(year || '', 0, -20)
  ctx.fillText(`${month || ''}/${day || ''}`, 0, 20)
  ctx.restore()
}

async function drawWaveFooter(ctx, width, height) {
  const image = await loadImage(waveFooter)
  const footerHeight = 210
  ctx.drawImage(image, 0, height - footerHeight, width, footerHeight)
}

async function drawAchievement(ctx) {
  const image = await loadImage(achievementBadge)
  ctx.drawImage(image, 0, 0, 520, 129)
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

async function loadExportFonts(style) {
  if (!document.fonts?.load) return

  const fontLoad = Object.entries(exportFontLoads).find(([family]) => {
    return style.quoteFont.includes(`"${family}"`) || style.metaFont.includes(`"${family}"`)
  })?.[1]

  if (!fontLoad) return

  await Promise.allSettled([
    withTimeout(document.fonts.load(fontLoad), 3000),
    withTimeout(document.fonts.ready, 3000),
  ])
}

function withTimeout(promise, timeout) {
  return Promise.race([
    promise,
    new Promise((resolve) => window.setTimeout(resolve, timeout)),
  ])
}
</script>
