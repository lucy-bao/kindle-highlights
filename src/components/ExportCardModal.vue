<template>
  <div class="modal" @click.self="$emit('close')">
    <section class="card-panel">
      <div class="panel-head">
        <h2>导出卡片</h2>
        <button aria-label="关闭" @click="$emit('close')">×</button>
      </div>

      <div class="style-options">
        <button
          v-for="style in cardStyles"
          :key="style.id"
          :class="{ active: selectedStyle === style.id }"
          @click="selectedStyle = style.id"
        >
          {{ style.name }}
        </button>
      </div>

      <article ref="exportCard" class="export-card" :class="selectedStyle">
        <p class="export-quote">{{ item.content }}</p>
        <div>
          <strong>{{ item.title }}</strong>
          <span>{{ item.author }} · {{ locationText(item) }}</span>
        </div>
      </article>

      <button class="primary" @click="downloadCard">下载图片</button>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { locationText } from '../utils/formatters'

const props = defineProps({
  item: { type: Object, required: true },
})

defineEmits(['close'])

const exportCard = ref(null)
const selectedStyle = ref('classic')
const cardStyles = [
  { id: 'classic', name: '经典' },
  { id: 'ink', name: '墨黑' },
  { id: 'warm', name: '暖纸' },
]

async function downloadCard() {
  if (!exportCard.value || !props.item) return

  const rect = exportCard.value.getBoundingClientRect()
  const styles = getComputedStyle(exportCard.value)
  const width = Math.round(rect.width)
  const height = Math.round(rect.height)
  const canvas = document.createElement('canvas')
  const scale = 2
  const ctx = canvas.getContext('2d')

  canvas.width = width * scale
  canvas.height = height * scale
  ctx.scale(scale, scale)
  ctx.fillStyle = styles.backgroundColor
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = styles.color
  ctx.textBaseline = 'top'

  // Canvas 导出时不能直接复用 DOM 排版，所以这里做一次简化换行绘制。
  drawWrappedText(ctx, props.item.content, 42, 42, width - 84, 28, Math.floor((height - 150) / 28), '600 22px Georgia, serif')
  ctx.font = '700 16px system-ui, sans-serif'
  ctx.fillText(props.item.title.slice(0, 36), 42, height - 84)
  ctx.font = '14px system-ui, sans-serif'
  ctx.globalAlpha = 0.72
  ctx.fillText(`${props.item.author} · ${locationText(props.item)}`.slice(0, 48), 42, height - 54)
  ctx.globalAlpha = 1

  const link = document.createElement('a')
  link.download = `kindle-highlight-${Date.now()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines, font) {
  ctx.font = font
  const chars = Array.from(text)
  let line = ''
  let lineIndex = 0

  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index]
    const next = line + char

    if (ctx.measureText(next).width > maxWidth && line) {
      if (lineIndex >= maxLines - 1) {
        ctx.fillText(`${line.slice(0, Math.max(0, line.length - 1))}...`, x, y + lineIndex * lineHeight)
        return
      }

      ctx.fillText(line, x, y + lineIndex * lineHeight)
      line = char
      lineIndex += 1
    } else {
      line = next
    }

    if (index === chars.length - 1 && lineIndex < maxLines) {
      ctx.fillText(line, x, y + lineIndex * lineHeight)
    }
  }
}
</script>
