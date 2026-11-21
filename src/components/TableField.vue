<script setup>
/**
 * A table field at generation time.
 *
 * The template fixes the layout, once, when it is uploaded:
 *   cols  — headings across the top; here you add ROWS underneath.
 *   rows  — headings down the left; here you fill values, and may add COLUMNS.
 * A template that never named its columns falls back to a free paste box.
 *
 * Emits an array of row objects: [{ c1: 'Aspirin', c2: '100' }, …]
 */
import { computed, ref, watch } from 'vue'

const props = defineProps({
  label: { type: String, default: 'Table' },
  spec: { type: [Array, Object], default: () => [] }
})
const emit = defineEmits(['update:modelValue'])

/** A plain array is the old "columns across the top" shape. */
const normalised = computed(() => {
  const s = props.spec
  if (Array.isArray(s)) return { orientation: 'cols', labels: s }
  if (s && typeof s === 'object') {
    return { orientation: s.orientation === 'rows' ? 'rows' : 'cols', labels: s.labels || s.headers || [] }
  }
  return { orientation: 'cols', labels: [] }
})

const mode = computed(() => {
  if (!normalised.value.labels.length) return 'paste'
  return normalised.value.orientation === 'rows' ? 'rows' : 'cols'
})
const labels = computed(() => normalised.value.labels)

// ---------------------------------------------------------------- cols layout
const gridRows = ref([[]])
watch(labels, (l) => { gridRows.value = [Array(l.length).fill('')] }, { immediate: true })

function emitCols () {
  const rows = gridRows.value
    .filter((r) => r.some((c) => (c || '').trim() !== ''))
    .map((r) => Object.fromEntries(r.map((c, i) => [`c${i + 1}`, c])))
  emit('update:modelValue', rows)
}
function addRow () { gridRows.value.push(Array(labels.value.length).fill('')) }
function delRow (i) {
  gridRows.value.splice(i, 1)
  if (!gridRows.value.length) gridRows.value.push(Array(labels.value.length).fill(''))
  emitCols()
}

/** Paste a block copied from Excel into any cell: it fills across and down. */
function onPaste (e, ri, ci) {
  const text = e.clipboardData?.getData('text') || ''
  if (!/[\t\n]/.test(text)) return
  e.preventDefault()
  const block = text.replace(/\r/g, '').split('\n').filter(Boolean).map((l) => l.split('\t'))
  block.forEach((line, gi) => {
    const tr = ri + gi
    if (!gridRows.value[tr]) gridRows.value[tr] = Array(labels.value.length).fill('')
    line.forEach((cell, gj) => {
      const tc = ci + gj
      if (tc < labels.value.length) gridRows.value[tr][tc] = cell.trim()
    })
  })
  emitCols()
}

// ---------------------------------------------------------------- rows layout
const valueCols = ref(1)
const rowGrid = ref([])
watch([labels, valueCols], () => {
  rowGrid.value = labels.value.map((_, i) => {
    const existing = rowGrid.value[i] || []
    return Array.from({ length: valueCols.value }, (_, j) => existing[j] ?? '')
  })
}, { immediate: true })

function emitRows () {
  emit('update:modelValue', rowGrid.value.map((r) => Object.fromEntries(r.map((c, i) => [`c${i + 1}`, c || '']))))
}
function addCol () { valueCols.value += 1 }
function delCol () { if (valueCols.value > 1) valueCols.value -= 1 }

// --------------------------------------------------------------- paste layout
const raw = ref('')
const skipHeader = ref(true)
const parsed = computed(() =>
  raw.value.replace(/\r/g, '').split('\n').filter((l) => l.trim() !== '').map((l) => l.split('\t').map((c) => c.trim()))
)
function emitPaste () {
  const grid = skipHeader.value ? parsed.value.slice(1) : parsed.value
  emit('update:modelValue', grid.map((cells) => Object.fromEntries(cells.map((c, i) => [`c${i + 1}`, c]))))
}
</script>

<template>
  <div>
    <!-- Headings across the top: add as many rows as you need. -->
    <div v-if="mode === 'cols'">
      <div class="overflow-auto">
        <table class="q-table--dense full-width">
          <thead>
            <tr>
              <th v-for="(h, i) in labels" :key="i" class="text-left small">{{ h || `Column ${i + 1}` }}</th>
              <th style="width: 32px" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, ri) in gridRows" :key="ri">
              <td v-for="(_, ci) in labels" :key="ci" class="q-pa-xs">
                <q-input v-model="gridRows[ri][ci]" dense outlined @update:model-value="emitCols" @paste="onPaste($event, ri, ci)" />
              </td>
              <td class="text-center">
                <q-btn v-if="gridRows.length > 1" flat dense round size="sm" icon="close" @click="delRow(ri)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <q-btn flat dense size="sm" color="primary" icon="add" label="Add row" class="q-mt-sm" @click="addRow" />
      <div class="muted small q-mt-xs">
        Type into the cells, or paste a block copied from Excel — it fills across and down. Empty rows are ignored.
      </div>
    </div>

    <!-- Headings down the left: fixed rows, add value columns. -->
    <div v-else-if="mode === 'rows'">
      <div class="overflow-auto">
        <table class="q-table--dense full-width">
          <tbody>
            <tr v-for="(lb, i) in labels" :key="i">
              <th class="text-left small" style="white-space: nowrap">{{ lb || `Label ${i + 1}` }}</th>
              <td v-for="(_, j) in valueCols" :key="j" class="q-pa-xs">
                <q-input v-model="rowGrid[i][j]" dense outlined @update:model-value="emitRows" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="row-actions q-mt-sm">
        <q-btn flat dense size="sm" color="primary" icon="add" label="Add column" @click="addCol" />
        <q-btn v-if="valueCols > 1" flat dense size="sm" label="Remove last column" @click="delCol" />
      </div>
      <div class="muted small q-mt-xs">The row labels are fixed by the template. Fill in the values.</div>
    </div>

    <!-- No columns were ever named on this template. -->
    <div v-else>
      <q-input v-model="raw" type="textarea" outlined dense rows="4"
               placeholder="Paste rows copied from Excel here — columns line up automatically."
               @update:model-value="emitPaste" />
      <q-checkbox v-model="skipHeader" dense label="First pasted row is a header — skip it" @update:model-value="emitPaste" />
      <div v-if="parsed.length" class="muted small q-mt-xs">
        {{ skipHeader ? parsed.length - 1 : parsed.length }} row(s) will be inserted into {{ label }}.
      </div>
    </div>
  </div>
</template>
