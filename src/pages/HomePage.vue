<script setup>
import { onMounted, ref } from 'vue'
import api from 'src/services/api'
import { useAuth } from 'src/stores/auth'

const auth = useAuth()
const stats = ref(null)
onMounted(async () => { stats.value = (await api.get('/api/dashboard')).data })
</script>

<template>
  <q-page class="page-pad">
    <div class="text-h6 q-mb-md">Hello, {{ auth.me?.display_name?.split(' ')[0] }}</div>

    <div v-if="stats" class="row q-col-gutter-md q-mb-md">
      <div v-for="c in [
             { label: 'Waiting on you', value: stats.awaiting_me, to: '/queue' },
             { label: 'Letters signed', value: stats.signed_this_fy },
             { label: 'Letters sent', value: stats.sent },
             { label: 'Total on record', value: stats.total }
           ]" :key="c.label" class="col-6 col-md-3">
        <q-card flat bordered class="q-pa-md cursor-pointer" @click="c.to && $router.push(c.to)">
          <div class="text-h5">{{ c.value }}</div>
          <div class="muted small">{{ c.label }}</div>
        </q-card>
      </div>
    </div>

    <div v-if="stats?.recent?.length" class="card-soft">
      <div class="text-subtitle2 q-mb-sm">Recent letters</div>
      <q-markup-table flat dense>
        <tbody>
          <tr v-for="l in stats.recent" :key="l.id">
            <td class="mono small">{{ l.ref_no }}</td>
            <td>{{ l.subject || '—' }}</td>
            <td class="muted small">{{ l.status }}</td>
          </tr>
        </tbody>
      </q-markup-table>
    </div>
  </q-page>
</template>
