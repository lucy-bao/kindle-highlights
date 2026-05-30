<template>
  <article class="share-card classic-share-card" :class="[`style-${styleType}`, { 'export-mode': exportMode }]">
    <p class="share-quote">{{ item.content }}</p>
    <div class="share-meta">
      <p class="share-book">{{ item.title }}</p>
      <p class="share-author">{{ item.author }}</p>
      <p class="share-date">{{ displayDate }}</p>
    </div>
    <div v-if="styleType === 'vintage'" class="share-stamp" aria-hidden="true">
      <img :src="emailStamp" alt="" />
      <span class="stamp-date">
        <span>{{ stampYear }}</span>
        <span>{{ stampDay }}</span>
      </span>
    </div>
    <img v-if="styleType === 'pixel'" class="share-achievement" :src="achievementBadge" alt="" aria-hidden="true" />
    <img v-if="styleType === 'cute'" class="share-wave-footer" :src="waveFooter" alt="" aria-hidden="true" />
  </article>
</template>

<script setup>
import { computed } from 'vue'
import emailStamp from '../../assets/images/email.png'
import achievementBadge from '../../assets/images/achievement-badge.png'
import waveFooter from '../../assets/images/compiled_wave_illustration.svg'
import { clippingDateText } from '../../utils/formatters'

const props = defineProps({
  exportMode: { type: Boolean, default: false },
  item: { type: Object, required: true },
  styleType: { type: String, default: 'classic' },
})

const displayDate = computed(() => clippingDateText(props.item).replaceAll('-', '/'))
const stampYear = computed(() => displayDate.value.split('/')[0] || '')
const stampDay = computed(() => displayDate.value.split('/').slice(1).join('/') || '')
</script>
