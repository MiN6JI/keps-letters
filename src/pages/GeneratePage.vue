<script setup>
/**
 * Pick a template, fill what it asks for, generate.
 *
 * Anything the system already knows — reference number, date, financial year, the
 * issuing company, the signatory's name and designation — is never asked for here.
 * Neither is a {{x_in_words}} field: it derives itself from the number beside it.
 */
import { computed, onMounted, ref } from 'vue'
import api, { openTemplatePreview, toast } from 'src/services/api'
import { useAuth } from 'src/stores/auth'
import TableField from 'components/TableField.vue'

const auth = useAuth()
const formats = ref([])
const fields = ref([])
const users = ref([])

const chosen = ref(null)
const companyId = ref(null)
const subject = ref('')
const recipient = ref('')
const validTill = ref('')
const signatory = ref('')
const values = ref({})
const busy = ref(false)

onMounted(async () => {
  const [f, fl, u] = await Promise.all([
    api.get('/api/formats'), api.get('/api/fields'), api.get('/api/users')
  ])
  formats.value = f.data.filter((x) => x.status === 'active')
  fields.value = fl.data
  users.value = u.data
})

const tableSpecs = computed(() => {
  try { return JSON.parse(chosen.value?.table_headers || '{}') } catch { return {} }
})

/**
 * What the person must fill in. A {{@table}} tag is a table even when no dynamic
 * field was ever created for it — the template's setup is what decides.
 */
const asked = computed(() => {
  if (!chosen.value) return []
  const keys = JSON.parse(chosen.value.field_keys || '[]')
  return keys.map((k) => {
    const known = fields.value.find((f) => f.key === k) || { key: k, label: k, type: 'text' }
    if (tableSpecs.value[k] && known.type !== 'table') return { ...known, type: 'table' }
    return known
  }).filter((f) => !f.auto_source)
})

function pick (f) {
  chosen.value = f
  companyId.value = f.company_id
  values.value = {}
  signatory.value = f.required_signatory || ''
}

async function generate () {
  busy.value = true
  try {
    const payload = {
      format_id: chosen.value.id,
      field_values: values.value,
      subject: subject.value,
      recipient_email: recipient.value || null,
      valid_till: validTill.value || null,
      signatory: signatory.value || null
    }
    // Only a template marked "any company" lets the issuing company be chosen.
    if (chosen.value.all_companies) payload.company_id = Number(companyId.value)

    const { data } = await api.post('/api/letters', payload)
    toast(`Letter ${data.ref_no} created.`)
    chosen.value = null
    subject.value = recipient.value = ''
    values.value = {}
  } catch (e) { toast(e.friendly, 'negative') }
  busy.value = false
}
</script>

<template>
  <q-page class="page-pad">
    <!-- Step 1: choose a template -->
    <div v-if="!chosen">
      <div class="text-h6 q-mb-sm">Generate a letter</div>
      <div class="muted small q-mb-md">Pick a template — the letter writes itself onto the letterhead and files itself away.</div>

      <q-list bordered separator class="bg-white rounded-borders">
        <q-item v-for="f in formats" :key="f.id" clickable @click="pick(f)">
          <q-item-section>
            <q-item-label>
              {{ f.name }}
              <span v-if="f.all_companies" class="tag">any company</span>
            </q-item-label>
            <q-item-label caption>{{ f.letter_type || 'Letter' }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn flat dense size="sm" label="view" @click.stop="openTemplatePreview(f.id)" />
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <!-- Step 2: fill it in -->
    <div v-else>
      <div class="card-soft row items-center justify-between">
        <div>
          <div class="text-subtitle1">{{ chosen.name }}</div>
          <div class="muted small">{{ chosen.letter_type }}</div>
        </div>
        <div class="row-actions">
          <q-select v-if="chosen.all_companies" v-model="companyId" dense outlined emit-value map-options
                    style="min-width: 220px"
                    :options="auth.companies.map((c) => ({ label: c.name, value: c.id }))"
                    label="Issuing company" />
          <q-btn flat dense size="sm" label="View template" @click="openTemplatePreview(chosen.id)" />
          <q-btn flat dense size="sm" label="← change template" @click="chosen = null" />
        </div>
      </div>

      <div class="card-soft">
        <q-input v-model="subject" dense outlined label="Subject of the letter" class="q-mb-md" />

        <div v-for="fd in asked" :key="fd.key" class="q-mb-md">
          <div class="text-weight-medium">
            {{ fd.label }}
            <span v-if="fd.description" class="muted small">— {{ fd.description }}</span>
          </div>

          <TableField v-if="fd.type === 'table'" :label="fd.label" :spec="tableSpecs[fd.key] || []"
                      @update:model-value="(rows) => (values[fd.key] = rows)" />

          <q-input v-else-if="fd.type === 'textarea'" v-model="values[fd.key]" type="textarea" rows="3" dense outlined
                   hint="Line breaks are kept — use them for an address." />
          <q-input v-else-if="fd.type === 'date'" v-model="values[fd.key]" type="date" dense outlined />
          <q-input v-else-if="fd.type === 'number'" v-model="values[fd.key]" type="number" dense outlined />
          <q-select v-else-if="fd.type === 'dropdown'" v-model="values[fd.key]" dense outlined
                    :options="JSON.parse(fd.options || '[]')" />
          <q-input v-else v-model="values[fd.key]" dense outlined :placeholder="fd.example" />
        </div>

        <q-select v-if="chosen.signatory_mode === 'assign'" v-model="signatory" dense outlined emit-value map-options
                  class="q-mb-md" label="Who signs this letter?"
                  :options="users.map((u) => ({ label: u.display_name, value: u.upn }))" />

        <div class="row q-col-gutter-md q-mb-md">
          <q-input v-model="recipient" dense outlined class="col" label="Send to (email, optional)" />
          <q-input v-model="validTill" dense outlined type="date" class="col" label="Valid till (for reminders)" />
        </div>

        <q-btn color="primary" :loading="busy" label="Generate & file" @click="generate" />
      </div>
    </div>
  </q-page>
</template>
