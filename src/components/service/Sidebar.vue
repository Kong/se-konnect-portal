<template>
  <aside>
    <div class="px-5 py-6 content">
      <header class="mb-6">
        <span class="title mb-5">
          {{ servicePackage?.display_name }}
        </span>
        <KSelect
          appearance="select"
          class="version-select-dropdown"
          width="100%"
          data-testid="version-select-dropdown"
          :enable-filtering="false"
          :items="versionSelectItems"
          @change="onChangeVersion"
        >
          <template #empty>
            <div>{{ helpText.noResults }}</div>
          </template>
        </KSelect>
      </header>
      <SectionOverview :service="servicePackage" />
      <SectionReference
        :active-service-version-id="activeServiceVersionId"
        :service="servicePackage"
        :deselect-operation="deselectOperation"
        @operation-selected="emit('operationSelected', $event)"
      />
    </div>
  </aside>
</template>

<script lang="ts" setup>
import { onMounted, watch, ref } from 'vue'
import SectionOverview from './sidebar/SectionOverview.vue'
import SectionReference from './sidebar/SectionReference.vue'
import { storeToRefs } from 'pinia'
import { useI18nStore, useServicePackageStore } from '@/stores'

const servicePackageStore = useServicePackageStore()
const { servicePackage, activeServiceVersionId } = storeToRefs(servicePackageStore)
const helpText = useI18nStore().state.helpText.sidebar

const emit = defineEmits(['operationSelected'])

defineProps({
  deselectOperation: {
    type: Boolean,
    default: false
  }
})

const versionSelectItems = ref([])

function updateVersionSelectItems () {
  versionSelectItems.value = servicePackage.value?.versions
    .slice() // clone before sorting
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((serviceVersion) => ({
      value: serviceVersion.id,
      label: `${serviceVersion.version}${serviceVersion.deprecated ? ' (Deprecated)' : ''}`,
      selected: serviceVersion.id === activeServiceVersionId.value
    })) || []
}

function onChangeVersion (event) {
  const version = servicePackage.value?.versions.find((serviceVersion) => serviceVersion.id === event.value)
  if (!version) {
    return
  }

  servicePackageStore.setActiveServiceVersionId(version.id)
}

onMounted(() => {
  updateVersionSelectItems()
})

watch([
  () => servicePackage.value,
  () => activeServiceVersionId.value
], () => {
  updateVersionSelectItems()
})

</script>

<style scoped>
  aside {
    width: 100%;
    max-width: 260px;
  }

  .title {
    font-weight: 500;
    font-size: 20px;
    display: block;
    color: var(--text_colors-primary);
  }

  .version-select-dropdown :deep(div.k-select-input.select-input-container) {
    border-color: var(--section_colors-stroke);
  }
</style>
