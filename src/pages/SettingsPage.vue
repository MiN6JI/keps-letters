<script setup>
import { onMounted, ref } from 'vue'
import api, { toast } from 'src/services/api'

const sig = ref(null)
const busy = ref(false)

onMounted(async () => { sig.value = (await api.get('/api/users/me/signature')).data.signature_png })

function onFile (file) {
  if (!file) return
  const rd = new FileReader()
  rd.onload = async () => {
    busy.value = true
    try {
      await api.put('/api/users/me/signature', { signature_png: rd.result })
      sig.value = rd.result
      toast('Signature saved.')
    } catch (e) { toast(e.friendly, 'negative') }
    busy.value = false
  }
  rd.readAsDataURL(file)
}

async function clearSig () {
  if (!confirm('Remove your signature image?')) return
  await api.put('/api/users/me/signature', { signature_png: null })
  sig.value = null
}
</script>

<template>
  <q-page class="page-pad">
    <div class="text-h6 q-mb-md">Settings</div>
    <div class="card-soft" style="max-width: 520px">
      <div class="text-subtitle2 q-mb-xs">Your signature</div>
      <div class="muted small q-mb-sm">
        A transparent PNG works best. Whether it appears on a letter depends on the template's
        signature style.
      </div>
      <img v-if="sig" :src="sig" alt="signature" style="max-height: 70px; margin-bottom: 8px" />
      <q-file dense outlined accept="image/*" label="Upload a signature image" :loading="busy" @update:model-value="onFile" />
      <q-btn v-if="sig" flat dense size="sm" color="negative" class="q-mt-sm" label="Remove" @click="clearSig" />
    </div>
  </q-page>
</template>
