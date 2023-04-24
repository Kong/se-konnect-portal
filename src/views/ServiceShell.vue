<template>
  <div class="container flex pb-0 service fixed-position">
    <EmptyState
      v-if="serviceError"
      is-error
      class="mt-6"
      :message="serviceError"
    />
    <template v-else>
      <div
        class="sidebar-wrapper"
      >
        <Sidebar
          class="sidebar"
          :deselect-operation="deselectOperation"
          @operation-selected="onOperationSelectedSidebar"
        />
      </div>
      <div class="content">
        <KAlert
          v-if="activeServiceVersionDeprecated"
          appearance="warning"
          :alert-message="helpText.serviceVersion.deprecatedWarning"
          class="deprecated-warning"
        />
        <!-- pass service to child routes as a prop -->
        <router-view :service="servicePackage" />
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import getMessageFromError from '@/helpers/getMessageFromError'
import usePortalApi from '@/hooks/usePortalApi'
import { useI18nStore, useServicePackageStore } from '@/stores'
import Sidebar from '@/components/service/Sidebar.vue'
import useToaster from '@/composables/useToaster'

const { notify } = useToaster()
const helpText = useI18nStore().state.helpText
const route = useRoute()
const router = useRouter()
const { portalApi } = usePortalApi()
const serviceError = ref(null)
const activeServiceVersionDeprecated = ref(false)
const deselectOperation = ref<boolean>(false)

// @ts-ignore
const servicePackageStore = useServicePackageStore()
const { servicePackage, documentTree, activeDocumentSlug, activeServiceVersionId } = storeToRefs(servicePackageStore)

const servicePackageIdParam = computed(() => route.params.service_package)
const serviceVersionParam = computed(() => route.params.service_version as string)

function setActiveDocumentSlug () {
  const slugs = route.params.slug

  // The last slug is the active document to be rendered
  const slug = Array.isArray(slugs) ? slugs[slugs.length - 1] : slugs

  if (slug !== activeDocumentSlug.value) {
    servicePackageStore.setActiveDocumentSlug(slug)
  }
}

async function fetchServicePackage () {
  const id = servicePackageIdParam.value

  try {
    const res = await portalApi.value.client.get(`/portal_api/service_packages/${id}`)

    servicePackageStore.setServicePackage(res.data)
  } catch (err) {
    console.error(err)
    serviceError.value = getMessageFromError(err)
  }
}

async function fetchDocumentTree () {
  const id = servicePackageIdParam.value

  try {
    const res = await portalApi.value.client.get(`/portal_api/service_packages/${id}/document_tree`)

    servicePackageStore.setDocumentTree(res.data.tree)
  } catch (err) {
    if (err.response.status === 404) {
      servicePackageStore.setDocumentTree([])
    } else {
      console.error(err)
      notify({
        appearance: 'danger',
        message: 'Unable to retrieve documentation'
      })
    }
  }
}

function initActiveServiceVersionId () {
  if (!servicePackage.value) {
    return
  }

  const versions = servicePackage.value.versions
    .slice()
    // @ts-ignore
    .sort((a, b) => new Date(a) - new Date(b))

  if (!versions) {
    return
  }

  // @ts-ignore
  const val = serviceVersionParam.value?.toLowerCase()
  if (val) {
    const newServiceVersion = versions.find(
      (serviceVersion) => serviceVersion.id === val || serviceVersion.version?.toLowerCase() === val
    )

    if (newServiceVersion) {
      servicePackageStore.setActiveServiceVersionId(newServiceVersion.id)
    }
  }

  if (!activeServiceVersionId.value) {
    servicePackageStore.setActiveServiceVersionId(versions[0]?.id)
  }
}

function routeToDocumentBySlug (slug) {
  if (slug) {
    router.replace({
      name: 'api-documentation-page',
      params: {
        service_package: route.params.service_package,
        slug: [slug]
      }
    })
  }
}

function onSwitchVersion () {
  if (route.name === 'spec') {
    servicePackageStore.setSidebarActiveOperation(null)

    router.push({
      name: 'spec',
      params: {
        service_package: servicePackageIdParam.value,
        service_version: activeServiceVersionId.value
      }
    })
  }
}

function onOperationSelectedSidebar (operation) {
  const routeLocation = {
    name: 'spec',
    params: {
      service_package: servicePackageIdParam.value,
      service_version: activeServiceVersionId.value
    }
  }

  if (route.name !== 'spec') {
    router.push(routeLocation).then(() => servicePackageStore.setSidebarActiveOperation(operation))
  } else {
    router.replace(routeLocation).then(() => servicePackageStore.setSidebarActiveOperation(operation))
  }
}

onMounted(async () => {
  setActiveDocumentSlug()
  await fetchServicePackage()
  await fetchDocumentTree()
  initActiveServiceVersionId()
})

watch(() => serviceVersionParam.value, () => {
  if (serviceVersionParam.value && (serviceVersionParam.value !== activeServiceVersionId.value)) {
    servicePackageStore.setActiveServiceVersionId(serviceVersionParam.value)
  }

  initActiveServiceVersionId()
})

// This ensures deselection of operations in the sidebar when the user navigates away from the spec page
watch(() => route.name, () => {
  deselectOperation.value = route.name !== 'spec'
})

watch(() => activeServiceVersionId.value, () => {
  onSwitchVersion()

  if (!servicePackage.value?.versions) {
    return
  }

  const newServiceVersion = servicePackage.value.versions.filter((version) => version.id === activeServiceVersionId.value)[0]

  activeServiceVersionDeprecated.value = newServiceVersion?.deprecated
})

watch(() => servicePackageIdParam.value, () => {
  if (servicePackageIdParam.value !== servicePackage.value?.id) {
    servicePackageStore.setServicePackage(null)
  }
})

watchEffect(() => {
  setActiveDocumentSlug()

  if (documentTree.value && !activeDocumentSlug.value && route.path.includes('/docs/')) {
    const firstDocumentSlug = documentTree.value[0]?.slug

    routeToDocumentBySlug(firstDocumentSlug)
  }
})
</script>

<style scoped>
.deprecated-warning.k-alert {
  border-radius: 0;
  position: sticky;
  top: 0;
  z-index: 1;
}

.container.service.page.fixed-position {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 100%;
}

.service {
  min-height: calc(100vh - var(--headerHeight));
}

.sidebar-wrapper {
  flex: 0 0 auto;
  border-right: 1px solid var(--section_colors-stroke);
}

.sidebar {
  height: 100%;
  overflow-y: auto;
}

.content {
  flex: 1 1 auto;
  overflow: auto;
  position: relative;
}
</style>
