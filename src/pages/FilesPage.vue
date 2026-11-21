<script setup>
import { onMounted, ref, watch } from 'vue'
import api, { openBlob } from 'src/services/api'
import { useAuth } from 'src/stores/auth'

const auth = useAuth()
const companyId = ref(null)
const tree = ref([])
const stack = ref([])       // breadcrumb trail, so Back is honest
const current = ref(null)

onMounted(() => { companyId.value = auth.companies[0]?.id })
watch(companyId, loadTree)

async function loadTree () {
  if (!companyId.value) return
  tree.value = (await api.get(`/api/folders?company_id=${companyId.value}&tree=archive`)).data
  current.value = null
  stack.value = []
}

async function open (folder) {
  const { data } = await api.get(`/api/folders/${folder.id}/contents`)
  stack.value.push(folder)
  current.value = data
}
function back () {
  stack.value.pop()
  const prev = stack.value[stack.value.length - 1]
  if (prev) open(prev).then(() => stack.value.pop())
  else { current.value = null }
}
</script>

<template>
  <q-page class="page-pad">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h6">Files</div>
      <q-select v-model="companyId" dense outlined emit-value map-options style="min-width:220px"
                :options="auth.companies.map((c) => ({ label: c.name, value: c.id }))" />
    </div>

    <div v-if="stack.length" class="q-mb-sm">
      <q-btn flat dense size="sm" icon="arrow_back" label="Back" @click="back" />
      <span class="muted small q-ml-sm">{{ stack.map((s) => s.name).join(' / ') }}</span>
    </div>

    <q-list bordered separator class="bg-white rounded-borders">
      <q-item v-for="f in (current ? current.folders : tree)" :key="f.id" clickable @click="open(f)">
        <q-item-section avatar><q-icon name="folder" color="primary" /></q-item-section>
        <q-item-section>{{ f.name }}</q-item-section>
      </q-item>

      <q-item v-for="l in (current?.letters || [])" :key="'l' + l.id">
        <q-item-section avatar><q-icon name="description" /></q-item-section>
        <q-item-section>
          <q-item-label>{{ l.subject || l.ref_no }}</q-item-label>
          <q-item-label caption class="mono">{{ l.ref_no }} · {{ l.status }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <div class="row-actions">
            <q-btn flat dense size="sm" label="PDF" @click="openBlob(`/api/letters/${l.id}/pdf`)" />
            <q-btn flat dense size="sm" label="Plain" @click="openBlob(`/api/letters/${l.id}/pdf-plain`)" />
            <q-btn flat dense size="sm" label="Audit" @click="openBlob(`/api/letters/${l.id}/audit`)" />
          </div>
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>
