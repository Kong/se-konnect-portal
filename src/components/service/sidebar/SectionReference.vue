<template>
  <Section v-if="service && service.versions.length">
    <KSkeleton v-if="isLoading" />
    <SpecOperationsList
      v-else-if="operations"
      :operations="operations"
      :deselect="deselectOperation"
      width="100%"
      class="operations-list"
      @selected="emit('operationSelected', $event)"
    />
  </Section>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import Section from './Section.vue'
import usePortalApi from '@/hooks/usePortalApi'
import { KSkeleton } from '@kong/kongponents'
import { SpecOperationsList } from '@kong-ui-public/spec-renderer'
import '@kong-ui-public/spec-renderer/dist/style.css'

const { portalApi } = usePortalApi()
const operations = ref(null)
const isLoading = ref(true)

const props = defineProps({
  service: {
    type: Object,
    required: true
  },
  activeServiceVersionId: {
    type: String,
    required: true
  },
  deselectOperation: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['operationSelected'])

async function fetchOperations () {
  const servicePackageId = props.service?.id
  const serviceVersionId = props.activeServiceVersionId

  if (!servicePackageId || !serviceVersionId) {
    return
  }

  isLoading.value = true

  try {
    const res = await portalApi.value.client.get(`/portal_api/service_packages/${servicePackageId}/service_versions/${serviceVersionId}/operations`)

    operations.value = res.data.operations
  } catch (err) {
    console.error(err)
    // TODO(TDX-2781): Display a global error?
  } finally {
    isLoading.value = false
  }
}

fetchOperations()

watch([() => props.service, () => props.activeServiceVersionId], fetchOperations)

</script>

<style scoped lang="scss">
.operations-list {
  --kong-ui-spec-renderer-operations-list-item-summary-text-color: var(--text_colors-primary);
  --kong-ui-spec-renderer-operations-list-section-label-text-color: var(--text_colors-primary);
  --kong-ui-spec-renderer-operations-list-section-icon-color-expanded: var(--text_colors-primary);
  --kong-ui-spec-renderer-operations-list-section-icon-color-collapsed: var(--text_colors-primary);
  --kong-ui-spec-renderer-operations-list-filter-icon-color: var(--text_colors-primary);
  --kong-ui-spec-renderer-operations-list-item-selected-bar-background: var(--section_colors-accent);
  --kong-ui-spec-renderer-operations-list-section-border-color: var(--section_colors-stroke);
  --kong-ui-spec-renderer-operations-list-item-border-color: var(--section_colors-stroke);

  // Hover and selected styles
  --kong-ui-spec-renderer-operations-list-item-background-hover: var(--text_colors-primary);
  --kong-ui-spec-renderer-operations-list-item-summary-text-color-hover: var(--section_colors-body);
  --kong-ui-spec-renderer-operations-list-item-background-selected: var(--text_colors-primary);
  --kong-ui-spec-renderer-operations-list-item-summary-text-color-selected: var(--section_colors-body);

  :deep(.k-input) {
    --KInputPlaceholderColor: color: var(--text_colors-primary);
    padding-left: 32px !important;
  }
}
</style>
