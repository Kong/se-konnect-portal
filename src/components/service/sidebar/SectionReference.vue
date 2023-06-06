<template>
  <Section >
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
import { SpecOperationsList } from '@kong-ui-public/spec-renderer'
import { portalApiV2 } from '@/services'
import { useRoute, useRouter } from 'vue-router'
import { CustomOperation, useProductStore } from '@/stores'
import '@kong-ui-public/spec-renderer/dist/style.css'
import yaml from 'js-yaml';

const ADMIN_API = import.meta.env.VITE_EE_API_URL;

const operations = ref<CustomOperation[]>(null)
const isLoading = ref(true)

const props = defineProps({
  service: {
    type: Object,
    required: true
  },
  activeProductVersionId: {
    type: String,
    required: true
  },
  deselectOperation: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['operationSelected'])
const $route = useRoute()
const productStore = useProductStore()

async function fetchOperations () {
  // const servicePackageId = props.service?.id
  // const serviceVersionId = props.activeProductVersionId
  const servicePackage = $route.params.service_package.toString()

  // if (!servicePackageId || !serviceVersionId) {
  //   return
  // }

  isLoading.value = true

  try {
    // const res = await portalApiV2.service.versionsApi.getProductVersionSpecOperations({
    //   productId: servicePackageId,
    //   versionId: serviceVersionId
    // })

    // operations.value = res.data.operations?.map(operation => ({
    //   ...operation,
    //   operationId: operation.operation_id
    // }))
    const requestOptions = {
          method: "GET",
          headers: {
            "kong-admin-token": "kong_admin"
          }
        };

    const response = await fetch(`${ADMIN_API}/files/${servicePackage}`, requestOptions);
    const oas = await response.json()
      .then(async res => {
        let rawContent = res.contents;
        let parsedObject
        if (res.path.indexOf("json") !== -1) {
          parsedObject = JSON.parse(rawContent)
        }
        if (res.path.indexOf("yaml") !== -1 || res.path.indexOf("yml") !== -1) {
          parsedObject = yaml.load(rawContent)
        }
        return parsedObject
      })
    const parsedOperations = parseOpenAPIOperations(oas)
    operations.value = parsedOperations?.map(operation => ({
      ...operation,
      operationId: operation.operationId
    }))

    console.log("ops", operations)
    
    productStore.setSidebarOperations(operations.value)
  } catch (err) {
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

fetchOperations()

watch([() => props.service, () => props.activeProductVersionId], fetchOperations)

function parseOpenAPIOperations(openAPI) {
  const operations = [];

  // Loop through the paths in the OpenAPI specification
  for (const path in openAPI.paths) {
    const pathObj = openAPI.paths[path];

    // Loop through the HTTP methods in each path
    for (const method in pathObj) {
      const operation = pathObj[method];

      // Extract the desired properties from the operation
      const operationId = operation.operationId;
      const summary = operation.summary;
      const tags = operation.tags;

      // Create an object with the extracted properties
      const operationObj = {
        method: method.toUpperCase(),
        operationId: operationId,
        summary: summary,
        path: path,
        tags: tags,
        deprecated: false
      };

      // Add the operation object to the result
      operations.push(operationObj);
    }
  }

  return operations;
}

</script>

<style scoped lang="scss">
section {
  margin-top: 0 !important;
}
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
    padding-left: 32px !important;
  }
}
</style>
