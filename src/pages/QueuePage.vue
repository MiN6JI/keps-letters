<script setup>
/**
 * What is waiting for me. This refreshes itself — a letter sent for approval shows up
 * without anyone signing out and back in.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import api, { openBlob, toast } from 'src/services/api'

const q = ref({ to_approve: [], to_sign: [], mine: [] })
let timer = null

async function load () {
  try { q.value = (await api.get('/api/letters/queues/mine')).data } catch { /* transient */ }
}

onMounted(() => {
  load()
  timer = setInterval(load, 45000)
  window.addEventListener('focus', load)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  window.removeEventListener('focus', load)
})

async function approve (l) {
  try { await api.post(`/api/letters/${l.id}/approve-content`, {}); toast('Approved.'); load() }
  catch (e) { toast(e.friendly, 'negative') }
}
async function reject (l) {
  const reason = prompt('Reason?') || ''
  try { await api.post(`/api/letters/${l.id}/reject-content`, { reason }); load() }
  catch (e) { toast(e.friendly, 'negative') }
}
async function sign (l) {
  // Microsoft users are already authenticated by their session; local accounts step up.
  const password = prompt('Re-enter your password to sign, or leave blank if you sign in with Microsoft:') ?? ''
  try { await api.post(`/api/letters/${l.id}/sign`, { password }); toast('Signed.'); load() }
  catch (e) { toast(e.friendly, 'negative') }
}
async function send (l) {
  const to = prompt('Send this letter to (email):', l.recipient_email || '')
  if (to === null) return
  try { await api.post(`/api/letters/${l.id}/send`, { recipient_email: to.trim() }); toast('Recorded as sent.'); load() }
  catch (e) { toast(e.friendly, 'negative') }
}
</script>

<template>
  <q-page class="page-pad">
    <div class="text-h6 q-mb-md">My queue</div>

    <div class="card-soft">
      <div class="text-subtitle2 q-mb-sm">Waiting for your approval ({{ q.to_approve.length }})</div>
      <div v-if="!q.to_approve.length" class="muted small">Nothing to approve.</div>
      <q-markup-table v-else flat dense>
        <tbody>
          <tr v-for="l in q.to_approve" :key="l.id">
            <td class="mono small">{{ l.ref_no }}</td>
            <td>{{ l.subject || '—' }}</td>
            <td class="text-right">
              <div class="row-actions">
                <!-- Approvers can read the draft before committing to it. -->
                <q-btn flat dense size="sm" label="View" @click="openBlob(`/api/letters/${l.id}/pdf`)" />
                <q-btn flat dense size="sm" color="primary" label="Approve" @click="approve(l)" />
                <q-btn flat dense size="sm" color="negative" label="Reject" @click="reject(l)" />
              </div>
            </td>
          </tr>
        </tbody>
      </q-markup-table>
    </div>

    <div class="card-soft">
      <div class="text-subtitle2 q-mb-sm">Waiting for your signature ({{ q.to_sign.length }})</div>
      <div v-if="!q.to_sign.length" class="muted small">Nothing to sign.</div>
      <q-markup-table v-else flat dense>
        <tbody>
          <tr v-for="l in q.to_sign" :key="l.id">
            <td class="mono small">{{ l.ref_no }}</td>
            <td>{{ l.subject || '—' }}</td>
            <td class="text-right">
              <div class="row-actions">
                <q-btn flat dense size="sm" label="View" @click="openBlob(`/api/letters/${l.id}/pdf`)" />
                <q-btn flat dense size="sm" color="primary" label="Sign" @click="sign(l)" />
              </div>
            </td>
          </tr>
        </tbody>
      </q-markup-table>
    </div>

    <div class="card-soft">
      <div class="text-subtitle2 q-mb-sm">Letters you created</div>
      <q-markup-table flat dense>
        <tbody>
          <tr v-for="l in q.mine" :key="l.id">
            <td class="mono small">{{ l.ref_no }}</td>
            <td>{{ l.subject || '—' }}</td>
            <td class="muted small">{{ l.status }}</td>
            <td class="text-right">
              <div class="row-actions">
                <q-btn flat dense size="sm" label="PDF" @click="openBlob(`/api/letters/${l.id}/pdf`)" />
                <q-btn flat dense size="sm" label="Plain copy" @click="openBlob(`/api/letters/${l.id}/pdf-plain`)" />
                <q-btn v-if="['signed', 'sent'].includes(l.status)" flat dense size="sm" label="Send" @click="send(l)" />
              </div>
            </td>
          </tr>
        </tbody>
      </q-markup-table>
    </div>
  </q-page>
</template>
