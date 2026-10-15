<script setup lang="ts">
import { DuiLabel, DuiInput, DuiTextarea, DuiSelect, DuiSwitch } from '@dronico/droni-kit'

const props = defineProps<{
  field: AdminField
  /** Recurso al que pertenece el campo (para las sugerencias) */
  resource: string
  mode: 'create' | 'update'
  error?: string
}>()
const model = defineModel<any>()

const disabled = computed(() => props.mode === 'update' && !!props.field.createOnly)
const required = computed(() => !!props.field.required || (props.field.type === 'password' && props.mode === 'create'))
const listId = `suggest-${props.resource}-${props.field.name}`

// Sugerencias de valores existentes (se cargan la primera vez que se enfoca el campo)
const suggestions = ref<string[]>([])
let loaded = false
async function loadSuggestions() {
  if (!props.field.suggest || loaded) return
  loaded = true
  suggestions.value = await $fetch<string[]>(`/api/admin/${props.resource}/suggestions`, {
    query: { field: props.field.name },
  }).catch(() => [])
}

const inputType = computed(() => {
  switch (props.field.type) {
    case 'date':
      return 'date'
    case 'email':
      return 'email'
    case 'password':
      return 'password'
    default:
      return 'text'
  }
})
const isNumeric = computed(() => ['int', 'decimal', 'currency'].includes(props.field.type))
</script>

<template>
  <div v-if="field.type === 'boolean'" class="flex items-end pb-2">
    <DuiSwitch v-model="model" :label="field.label" :description="field.help" :disabled="disabled" />
  </div>
  <DuiLabel v-else :title="field.label" :required="required" :help-text="field.help" :error="error">
    <AdminRelationInput v-if="field.type === 'relation'" v-model="model" :resource="field.relation!.resource" :disabled="disabled" />
    <DuiTextarea v-else-if="field.type === 'text'" v-model="model" :maxlength="field.max" :disabled="disabled" block />
    <DuiSelect
      v-else-if="field.type === 'select'"
      v-model="model"
      :options="field.options!.map((o) => ({ label: o, value: o }))"
      item-label="label"
      item-value="value"
      :disabled="disabled"
      block
    />
    <template v-else>
      <DuiInput
        v-model="model"
        :type="inputType"
        :inputmode="isNumeric ? 'decimal' : undefined"
        :maxlength="field.max"
        :list="field.suggest ? listId : undefined"
        :autocomplete="field.type === 'password' ? 'new-password' : 'off'"
        :disabled="disabled"
        block
        @focus="loadSuggestions"
      />
      <datalist v-if="field.suggest" :id="listId">
        <option v-for="s in suggestions" :key="s" :value="s" />
      </datalist>
    </template>
  </DuiLabel>
</template>
