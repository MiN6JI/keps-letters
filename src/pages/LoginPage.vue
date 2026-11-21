<script setup>
import { onMounted, ref } from 'vue'
import api, { toast } from 'src/services/api'

const upn = ref(''), password = ref(''), msEnabled = ref(false), busy = ref(false)

onMounted(async () => {
  if (new URLSearchParams(location.search).get('expired')) {
    toast('Your session ended. Please sign in again.', 'warning')
  }
  try { msEnabled.value = (await api.get('/api/auth/microsoft/enabled')).data.enabled } catch { /* offline */ }
})

async function login () {
  busy.value = true
  try {
    const { data } = await api.post('/api/auth/login', { upn: upn.value, password: password.value })
    localStorage.setItem('letters_token', data.token)
    location.href = '/'
  } catch (e) { toast(e.friendly, 'negative') }
  busy.value = false
}
</script>

<template>
  <q-layout>
    <q-page-container>
      <q-page class="flex flex-center">
        <div class="card-soft" style="width: 360px">
          <div class="text-h6 text-primary q-mb-md">Letters</div>

          <q-btn v-if="msEnabled" color="primary" class="full-width q-mb-md"
                 icon="window" label="Sign in with Microsoft" href="/auth/microsoft" />

          <div class="muted small q-mb-sm">Local sign-in is for break-glass accounts only. Everyone
            in the Microsoft directory signs in above.</div>

          <q-input v-model="upn" dense outlined label="Email" class="q-mb-sm" />
          <q-input v-model="password" dense outlined type="password" label="Password" class="q-mb-md" @keyup.enter="login" />
          <q-btn outline class="full-width" :loading="busy" label="Sign in" @click="login" />
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>
