<script setup>
/**
 * People & access. Microsoft Entra is the source of truth for who exists; roles and
 * company grants stay app-level decisions.
 */
import { onMounted, ref } from 'vue'
import api, { toast } from 'src/services/api'
import { useAuth } from 'src/stores/auth'

const auth = useAuth()
const tab = ref('people')
const users = ref([])
const audit = ref([])
const syncing = ref(false)

onMounted(load)
async function load () {
  users.value = (await api.get('/api/users')).data
}

async function loadAudit () { audit.value = (await api.get('/api/audit?limit=100')).data }

async function syncMicrosoft () {
  if (!confirm('Sync with your Microsoft 365 directory now? People removed or disabled in Microsoft will immediately lose access here.')) return
  syncing.value = true
  try {
    const { data } = await api.post('/api/users/sync-microsoft', {})
    const fmt = (a) => (a.length ? a.join(', ') : 'none')
    alert(`Synced against ${data.in_directory} directory accounts.\n\n` +
          `Deactivated: ${fmt(data.deactivated)}\nReactivated: ${fmt(data.reactivated)}\nDetails refreshed: ${fmt(data.updated)}`)
    await load()
  } catch (e) { toast(e.friendly, 'negative') }
  syncing.value = false
}

async function toggleActive (u) {
  const goingOff = u.active
  if (goingOff && !confirm(`Deactivate ${u.display_name}? They lose access immediately, even mid-session.`)) return
  try { await api.post(`/api/users/${u.id}/active`, { active: !goingOff }); await load() }
  catch (e) { toast(e.friendly, 'negative') }
}

async function setRole (u, role) {
  try { await api.put(`/api/users/${u.id}`, { role }); await load() }
  catch (e) { toast(e.friendly, 'negative') }
}

async function removeUser (u) {
  if (!confirm(`Remove ${u.display_name}? Letters they created stay in the registry.`)) return
  try { await api.delete(`/api/users/${u.id}`); await load() }
  catch (e) { toast(e.friendly, 'negative') }
}
</script>

<template>
  <q-page class="page-pad">
    <q-tabs v-model="tab" align="left" class="text-primary q-mb-md" @update:model-value="(t) => t === 'audit' && loadAudit()">
      <q-tab name="people" label="People & access" />
      <q-tab name="audit" label="Activity" />
    </q-tabs>

    <div v-if="tab === 'people'" class="card-soft">
      <div class="row items-center justify-between q-mb-sm">
        <div class="text-subtitle2">People & access</div>
        <div class="row-actions">
          <q-btn flat dense size="sm" :loading="syncing" label="Sync with Microsoft" @click="syncMicrosoft">
            <q-tooltip>
              Check every Microsoft account against your Microsoft 365 directory. People removed
              or disabled there are deactivated here; names and designations are refreshed.
            </q-tooltip>
          </q-btn>
        </div>
      </div>
      <div class="muted small q-mb-md">
        Only people on this list can sign in. Someone removed from Microsoft is deactivated on
        the next sync — and is refused immediately, even mid-session.
      </div>

      <q-markup-table flat bordered dense>
        <thead>
          <tr><th class="text-left">Person</th><th class="text-left">Sign-in</th><th class="text-left">Role</th><th /></tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>
              <b>{{ u.display_name }}</b>
              <div class="muted small">{{ u.upn }}</div>
            </td>
            <td class="muted small">{{ u.auth_source === 'microsoft' ? 'Microsoft' : 'Password' }}</td>
            <td>
              <q-select dense borderless :model-value="u.role" :options="['user', 'manager', 'admin']"
                        :disable="u.upn === auth.me.upn" @update:model-value="(r) => setRole(u, r)" />
            </td>
            <td class="text-right">
              <div v-if="u.upn !== auth.me.upn" class="row-actions">
                <span v-if="!u.active" class="tag tag--danger">inactive</span>
                <q-btn flat dense size="sm" :label="u.active ? 'Deactivate' : 'Reactivate'" @click="toggleActive(u)" />
                <q-btn flat dense size="sm" color="negative" label="Remove" @click="removeUser(u)" />
              </div>
            </td>
          </tr>
        </tbody>
      </q-markup-table>
    </div>

    <div v-else class="card-soft">
      <div class="text-subtitle2 q-mb-sm">Activity</div>
      <q-markup-table flat dense>
        <tbody>
          <tr v-for="a in audit" :key="a.id">
            <td class="muted small">{{ a.created_at }}</td>
            <td class="small">{{ a.actor }}</td>
            <td class="small">{{ a.action }}</td>
          </tr>
        </tbody>
      </q-markup-table>
    </div>
  </q-page>
</template>
