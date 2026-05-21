<template>
  <div class="container">
    <h1>Kindle Highlights</h1>

    <div class="controls">
      <label class="file">
        Upload highlights file
        <input type="file" @change="onFile" accept=".txt" />
      </label>
      <button @click="parse">Parse</button>
    </div>

    <textarea v-model="text" placeholder="Or paste highlights here" rows="8"></textarea>

    <div class="results">
      <div v-for="item in items" :key="item.title" class="book">
        <h2>{{ item.title }}</h2>
        <ul>
          <li v-for="(h, i) in item.highlights" :key="i">{{ h }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { parseHighlights } from './parser'

export default {
  setup() {
    const text = ref('')
    const items = ref([])

    function onFile(e) {
      const f = e.target.files[0]
      if (!f) return
      const reader = new FileReader()
      reader.onload = () => (text.value = reader.result)
      reader.readAsText(f, 'utf-8')
    }

    function parse() {
      items.value = parseHighlights(text.value || '')
    }

    return { text, items, onFile, parse }
  },
}
</script>

<style>
body { font-family: system-ui, Arial, sans-serif; padding: 1rem; }
.container { max-width: 780px; margin: 0 auto; }
.controls { display:flex; gap:8px; align-items:center; margin-bottom:8px }
textarea { width:100%; font-family: monospace; }
.book { border-top:1px solid #eee; padding-top:8px; margin-top:8px }
</style>
