<template>
  <section class="import-page">
    <button class="back" @click="$emit('back')">
      <img :src="backIcon" alt="" />
      返回书架
    </button>

    <div class="import-main">
      <div class="import-hero">
        <span class="book-icon">
          <img :src="bookIcon" alt="" />
        </span>
        <h1>让你的 Kindle 书摘重获新生</h1>
        <p>导入 Kindle 的 My Clippings.txt 文件，一键整理方便浏览，并支持生成精美的社交分享卡片。</p>
      </div>

      <div
        class="dropzone"
        :class="{ dragging: isDragging }"
        role="button"
        tabindex="0"
        @click="triggerFilePick"
        @keydown.enter.prevent="triggerFilePick"
        @keydown.space.prevent="triggerFilePick"
        @dragenter.prevent="isDragging = true"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDrop"
      >
        <input ref="fileInput" type="file" accept=".txt,text/plain" @click.stop @change="onFileInput" />
        <img class="upload-icon" :src="uploadIcon" alt="" />
        <strong>点击或拖拽文件到此处</strong>
        <small>电脑连接kindle，打开document文件，导入 My Clippings.txt 文件即可</small>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import uploadIcon from '../assets/images/upload.svg'
import bookIcon from '../assets/images/book.svg'
import backIcon from '../assets/images/back.svg'

defineProps({
  error: { type: String, default: '' },
})

const emit = defineEmits(['back', 'pick-file-access', 'upload-file'])
const fileInput = ref(null)
const isDragging = ref(false)

function triggerFilePick() {
  // 支持的浏览器优先走系统文件句柄能力，便于下次打开自动读取同一个文件。
  if (window.showOpenFilePicker) {
    emit('pick-file-access')
    return
  }

  fileInput.value?.click()
}

function onFileInput(event) {
  emit('upload-file', event.target.files?.[0])
  event.target.value = ''
}

function onDrop(event) {
  isDragging.value = false
  emit('upload-file', event.dataTransfer.files?.[0])
}
</script>
