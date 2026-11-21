<script setup>
/**
 * Templates and the dynamic-field library.
 *
 * A table is set up here, once per template: its layout (headings across the top, or
 * down the left) and the heading names. The same {{@items}} tag can therefore be an
 * order table in one template and a spec sheet in another — the setup lives on the
 * template, not on the field.
 */
import { computed, onMounted, ref } from "vue";
import api, { openTemplatePreview, toast } from "src/services/api";
import { useAuth } from "src/stores/auth";

const auth = useAuth();
const tab = ref("list");

const formats = ref([]);
const fields = ref([]);
const users = ref([]);

onMounted(load);
async function load() {
  const [f, fl, u] = await Promise.all([
    api.get("/api/formats"),
    api.get("/api/fields"),
    api.get("/api/users"),
  ]);
  formats.value = f.data;
  fields.value = fl.data;
  users.value = u.data;
}

const letterTypes = computed(() =>
  [...new Set(formats.value.map((f) => f.letter_type).filter(Boolean))].sort(),
);

// ------------------------------------------------------------------ authoring
const form = ref({
  company_id: null,
  name: "",
  letter_type: "",
  all_companies: false,
  plain_letterhead: false,
  no_signature: false,
  signatory: "",
  signature_style: "both",
  approvals: 0,
  approver_1: "",
  file: null,
});
const inspected = ref(null);
const tableSetup = ref({}); // key -> { orientation, labels: [] }
const busy = ref(false);

async function onFile(file) {
  form.value.file = file;
  inspected.value = null;
  tableSetup.value = {};
  if (!file) return;
  const fd = new FormData();
  fd.append("template", file);
  try {
    const { data } = await api.post("/api/formats/inspect", fd);
    inspected.value = data;
    data.tables.forEach((t) => {
      tableSetup.value[t.key] = { orientation: "cols", labels: [""] };
    });
  } catch (e) {
    toast(e.friendly, "negative");
  }
}

function addLabel(key) {
  tableSetup.value[key].labels.push("");
}
function delLabel(key, i) {
  tableSetup.value[key].labels.splice(i, 1);
}

async function submit() {
  busy.value = true;
  try {
    const fd = new FormData();
    fd.append("template", form.value.file);
    fd.append("company_id", form.value.company_id);
    fd.append("name", form.value.name);
    fd.append("letter_type", form.value.letter_type || "");
    fd.append("all_companies", form.value.all_companies ? "1" : "0");
    fd.append("plain_letterhead", form.value.plain_letterhead ? "1" : "0");
    fd.append("no_signature", form.value.no_signature ? "1" : "0");
    fd.append("signatory", form.value.no_signature ? "" : form.value.signatory);
    fd.append(
      "signature_style",
      form.value.no_signature ? "both" : form.value.signature_style,
    );
    fd.append("approvals", String(form.value.approvals));
    fd.append("approver_1", form.value.approvals ? form.value.approver_1 : "");
    if (inspected.value?.tables?.length) {
      const th = {};
      inspected.value.tables.forEach((t) => {
        th[t.key] = {
          orientation: tableSetup.value[t.key].orientation,
          labels: tableSetup.value[t.key].labels.map((s) => (s || "").trim()),
        };
      });
      fd.append("table_headers", JSON.stringify(th));
    }
    await api.post("/api/formats", fd);
    toast("Template submitted for approval.");
    tab.value = "list";
    inspected.value = null;
    await load();
  } catch (e) {
    toast(e.friendly, "negative");
  }
  busy.value = false;
}

// -------------------------------------------------------------- field library
const nf = ref({
  label: "",
  type: "text",
  description: "",
  example: "",
  category: "General",
  options: "",
});
const TYPES = ["text", "textarea", "date", "number", "dropdown", "table"];
const FRIENDLY = {
  text: "Short text",
  textarea: "Paragraph",
  date: "Date",
  number: "Number",
  dropdown: "Pick from a list",
  table: "Table",
};

const keyPreview = computed(() =>
  nf.value.label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, ""),
);

const tagFor = (f) => (f.type === "table" ? `{{@${f.key}}}` : `{{${f.key}}}`);

const grouped = computed(() => {
  const by = {};
  fields.value.forEach((f) => {
    (by[f.category || "General"] ||= []).push(f);
  });
  return by;
});

async function addField() {
  try {
    await api.post("/api/fields", { ...nf.value });
    nf.value = {
      label: "",
      type: "text",
      description: "",
      example: "",
      category: "General",
      options: "",
    };
    await load();
    toast("Field added.");
  } catch (e) {
    toast(e.friendly, "negative");
  }
}

async function copyTag(f) {
  await navigator.clipboard.writeText(tagFor(f));
  toast(`Copied ${tagFor(f)}`);
}

async function editField(f) {
  const label = prompt("Field name", f.label);
  if (label === null) return;
  const type = prompt(`Kind (${TYPES.join(" / ")})`, f.type);
  if (type === null) return;
  const description = prompt("Short help", f.description || "");
  if (description === null) return;
  const example = prompt("Example answer", f.example || "");
  if (example === null) return;
  try {
    await api.put(`/api/fields/${f.id}`, { label, type, description, example });
    await load();
  } catch (e) {
    toast(e.friendly, "negative");
  }
}

async function delField(f) {
  if (!confirm(`Delete the field "${f.label}"?`)) return;
  try {
    await api.delete(`/api/fields/${f.id}`);
    await load();
  } catch (e) {
    if (e.response?.status === 409) {
      const names = (e.response.data.usedBy || []).join(", ");
      if (
        !confirm(
          `"${f.label}" is used by: ${names}.\n\nDelete it anyway? Those templates will stop filling it in.`,
        )
      )
        return;
      await api.delete(`/api/fields/${f.id}?force=true`);
      await load();
    } else toast(e.friendly, "negative");
  }
}
</script>

<template>
  <q-page class="page-pad">
    <q-tabs v-model="tab" align="left" class="text-primary q-mb-md">
      <q-tab name="list" label="All templates" />
      <q-tab v-if="auth.isManager" name="add" label="Add a template" />
      <q-tab name="fields" label="Dynamic fields" />
    </q-tabs>

    <!-- ------------------------------------------------------------- list -->
    <div v-if="tab === 'list'">
      <q-markup-table flat bordered dense>
        <thead>
          <tr>
            <th class="text-left">Template</th>
            <th class="text-left">Type</th>
            <th class="text-left">Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in formats" :key="f.id">
            <td>
              {{ f.name
              }}<span v-if="f.all_companies" class="tag">any company</span>
            </td>
            <td class="muted small">{{ f.letter_type || "—" }}</td>
            <td class="muted small">{{ f.status }}</td>
            <td class="text-right">
              <div class="row-actions">
                <q-btn
                  flat
                  dense
                  size="sm"
                  label="View"
                  @click="openTemplatePreview(f.id)"
                />
                <q-btn
                  v-if="auth.isAdmin && f.status === 'pending_approval'"
                  flat
                  dense
                  size="sm"
                  color="primary"
                  label="Approve"
                  @click="
                    api.post(`/api/formats/${f.id}/approve`, {}).then(load)
                  "
                />
              </div>
            </td>
          </tr>
        </tbody>
      </q-markup-table>
    </div>

    <!-- -------------------------------------------------------------- add -->
    <div v-else-if="tab === 'add'">
      <div class="card-soft">
        <q-select
          v-model="form.company_id"
          dense
          outlined
          emit-value
          map-options
          class="q-mb-sm"
          label="Company"
          :options="auth.companies.map((c) => ({ label: c.name, value: c.id }))"
        />
        <q-input
          v-model="form.name"
          dense
          outlined
          label="Template name"
          class="q-mb-sm"
        />

        <!-- Pick an existing type, or type a new one. -->
        <q-select
          v-model="form.letter_type"
          dense
          outlined
          use-input
          new-value-mode="add-unique"
          class="q-mb-sm"
          label="Type of letter"
          :options="letterTypes"
          hint="Choose an existing type, or type a new one"
        />

        <q-checkbox
          v-model="form.all_companies"
          dense
          class="q-mb-sm"
          label="Any company can use this template — the issuing company is chosen while generating"
        />
        <q-checkbox
          v-model="form.plain_letterhead"
          dense
          class="q-mb-sm"
          label="Leave the page plain (printed on pre-printed letterhead)"
        />

        <q-file
          v-model="form.file"
          dense
          outlined
          accept=".docx"
          label="Word template (.docx)"
          class="q-mb-sm"
          @update:model-value="onFile"
        />
      </div>

      <!-- What the template needs -->
      <div v-if="inspected" class="card-soft" style="background: #eef5fc">
        <div class="text-weight-medium">
          This template asks for {{ inspected.count }} detail(s)
        </div>
        <div class="muted small q-mt-xs">
          Auto-filled by the system: {{ inspected.auto.join(", ") || "none" }}.
        </div>
        <div
          v-if="!inspected.has_signature_block"
          class="text-negative small q-mt-xs"
        >
          No <span v-pre>{{ signature_block }}</span> found — the signature and
          QR will have nowhere to go.
        </div>
      </div>

      <!-- Table setup: layout + heading names, fixed once, here -->
      <div v-if="inspected?.tables?.length" class="card-soft">
        <div class="text-weight-medium q-mb-xs">
          Set up your table{{ inspected.tables.length > 1 ? "s" : "" }}
        </div>
        <div class="muted small q-mb-md">
          Choose the layout and name the headings. These are fixed once set —
          when generating a letter, people only fill in the data.
        </div>

        <div v-for="t in inspected.tables" :key="t.key" class="q-mb-md">
          <div class="muted small">
            Table <span class="mono">{{ "{{@" + t.key + "}" + "}" }}</span>
          </div>
          <q-option-group
            v-model="tableSetup[t.key].orientation"
            dense
            class="q-my-xs"
            :options="[
              {
                label: 'Headings across the top — people add rows underneath',
                value: 'cols',
              },
              {
                label:
                  'Headings down the left — people fill a value beside each',
                value: 'rows',
              },
            ]"
          />
          <div class="row items-center q-gutter-xs">
            <div
              v-for="(_, i) in tableSetup[t.key].labels"
              :key="i"
              class="row items-center"
            >
              <q-input
                v-model="tableSetup[t.key].labels[i]"
                dense
                outlined
                style="width: 150px"
                :placeholder="
                  (tableSetup[t.key].orientation === 'rows'
                    ? 'Label '
                    : 'Column ') +
                  (i + 1)
                "
              />
              <q-btn
                v-if="tableSetup[t.key].labels.length > 1"
                flat
                dense
                round
                size="sm"
                icon="close"
                @click="delLabel(t.key, i)"
              />
            </div>
            <q-btn
              flat
              dense
              size="sm"
              color="primary"
              icon="add"
              :label="
                tableSetup[t.key].orientation === 'rows'
                  ? 'Add label'
                  : 'Add column'
              "
              @click="addLabel(t.key)"
            />
          </div>
        </div>
      </div>

      <!-- Signature -->
      <div class="card-soft">
        <div class="text-weight-medium q-mb-xs">Who signs the letter?</div>
        <q-select
          v-if="!form.no_signature"
          v-model="form.signatory"
          dense
          outlined
          emit-value
          map-options
          class="q-mb-sm"
          :options="users.map((u) => ({ label: u.display_name, value: u.upn }))"
        />
        <q-checkbox
          v-model="form.no_signature"
          dense
          label="No signature — internal only"
        />

        <div v-if="!form.no_signature" class="q-mt-sm">
          <div class="text-weight-medium q-mb-xs">
            What appears at the signature?
          </div>
          <q-option-group
            v-model="form.signature_style"
            dense
            :options="[
              {
                label: 'Uploaded signature and the digital seal',
                value: 'both',
              },
              {
                label: 'Uploaded signature only — clean, no QR or seal text',
                value: 'image',
              },
              {
                label: 'Digital seal only — typed name, verify QR',
                value: 'digital',
              },
            ]"
          />
        </div>
      </div>

      <q-btn
        color="primary"
        :loading="busy"
        :disable="!form.file || !form.name"
        label="Submit for approval"
        @click="submit"
      />
    </div>

    <!-- ----------------------------------------------------------- fields -->
    <div v-else>
      <div class="card-soft">
        <div class="text-weight-medium q-mb-sm">Add a new field</div>
        <div class="row q-col-gutter-sm">
          <q-input
            v-model="nf.label"
            dense
            outlined
            class="col"
            label="What is it called?"
          />
          <q-select
            v-model="nf.type"
            dense
            outlined
            class="col"
            label="What kind of answer?"
            :options="TYPES"
            :option-label="(t) => FRIENDLY[t]"
          />
        </div>

        <div
          v-if="nf.type === 'table'"
          class="card-soft q-mt-sm"
          style="background: #eef5fc"
        >
          <div class="text-weight-medium">How a table works</div>
          <div class="muted small q-mt-xs">
            You don't build a table in Word. Type the tag
            <span class="mono">{{
              "{{@" + (keyPreview || "tablekey") + "}" + "}"
            }}</span>
            on its own line, wherever the table should appear. The system
            inserts the whole table there, with a blank line above and below.
          </div>
          <div class="muted small q-mt-xs">
            You choose the layout and name the headings when you upload a
            template that uses this tag.
          </div>
        </div>

        <div class="row q-col-gutter-sm q-mt-sm">
          <q-input
            v-model="nf.description"
            dense
            outlined
            class="col"
            label="Short help"
          />
          <q-input
            v-model="nf.example"
            dense
            outlined
            class="col"
            label="Example answer"
          />
        </div>
        <q-input
          v-if="nf.type === 'dropdown'"
          v-model="nf.options"
          dense
          outlined
          class="q-mt-sm"
          label="Choices, comma-separated"
        />
        <div v-if="nf.label" class="muted small q-mt-sm">
          This becomes the tag
          <span class="mono">{{
            (nf.type === "table" ? "{{@" : "{" + "{") + keyPreview + "}" + "}"
          }}</span
          >.
        </div>
        <q-btn
          color="primary"
          class="q-mt-sm"
          :disable="!nf.label"
          label="Add field"
          @click="addField"
        />
      </div>

      <div class="card-soft">
        <div class="text-weight-medium">All fields ({{ fields.length }})</div>
        <div class="muted small q-mb-sm">
          A table is a field like any other — add one above with
          <b>Kind = Table</b>, and its tag
          <span class="mono" v-pre>{{@name}}</span> appears here to copy into
          a template.
        </div>

        <div v-for="(list, cat) in grouped" :key="cat" class="q-mb-md">
          <div class="text-caption text-primary text-uppercase q-mb-xs">
            {{ cat }}
          </div>
          <q-markup-table flat bordered dense>
            <thead>
              <tr>
                <th class="text-left">Field</th>
                <th class="text-left">Tag</th>
                <th class="text-left">Kind</th>
                <th class="text-left">What it's for</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr v-for="f in list" :key="f.key">
                <td>
                  <b>{{ f.label }}</b
                  ><span v-if="f.auto_source" class="tag">auto</span>
                </td>
                <td>
                  <q-btn
                    flat
                    dense
                    size="sm"
                    class="mono"
                    :label="tagFor(f)"
                    @click="copyTag(f)"
                  />
                </td>
                <td class="muted small">{{ FRIENDLY[f.type] || f.type }}</td>
                <td class="muted small">{{ f.description || "—" }}</td>
                <td class="text-right">
                  <div
                    v-if="auth.isAdmin && !f.auto_source"
                    class="row-actions"
                  >
                    <q-btn
                      flat
                      dense
                      size="sm"
                      label="Edit"
                      @click="editField(f)"
                    />
                    <q-btn
                      flat
                      dense
                      round
                      size="sm"
                      icon="delete"
                      @click="delField(f)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </q-markup-table>
        </div>
      </div>
    </div>
  </q-page>
</template>
