<template>
  <div
    :ref="specDetails"
    :class="{ spec: true, 'mt-6': true, 'api-documentation': true }"
  >
    <div class="container mx-auto max-w-screen-2xl px-5 md:px-0">
      <div class="swagger-ui has-sidebar breadcrumbs">
        <KBreadcrumbs :items="breadcrumbs" />
      </div>
    </div>
    <div class="container mx-auto max-w-screen-2xl px-5 md:px-0">
      <EmptyState
        v-if="hasServiceError"
        is-error
        class="mt-6"
        :message="hasServiceError"
      />
    </div>

    <div
      v-if="hasServiceError"
      class="spec-render-error"
    />

    <div
      v-else-if="loading"
      class="spec-loading-container"
    >
      <div>
        <KIcon
          icon="spinner"
          size="96"
          color="var(--steel-300)"
        />
      </div>
    </div>

    <SpecDetails
      v-else-if="spec"
      class="w-100"
      :document="spec"
      :has-sidebar="false"
      :application-registration-enabled="applicationRegistrationEnabled"
      :active-operation="sidebarActiveOperation"
      :current-version="currentVersion.version"
      @clicked-view-spec="triggerViewSpecModal"
      @clicked-register="triggerViewSpecRegistrationModal"
    />

    <ViewSpecModal
      :is-visible="viewSpecModalIsVisible"
      :spec-contents="specContents"
      :spec-name="specName"
      :download-callback="downloadSpecContents"
      @close="closeModal"
    />
    <ViewSpecRegistrationModal
      :initial-selected-application="$route.query.application"
      :is-visible="viewSpecRegistrationModalIsVisible"
      :service="service"
      :version="currentVersion"
      @close="closeModal"
    />
  </div>
</template>

<script>
import { defineComponent, computed, ref, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import markdownIt from 'markdown-it'
import markdownAnchor from 'markdown-it-anchor'
import markdownToc from 'markdown-it-toc-done-right'
import jsyaml from 'js-yaml'

import getMessageFromError from '@/helpers/getMessageFromError'
import ViewSpecModal from '../components/ViewSpecModal'
import ViewSpecRegistrationModal from '../components/ViewSpecRegistrationModal'
import usePortalApi from '@/hooks/usePortalApi'
import { useI18nStore, useAppStore, usePermissionsStore, useServicePackageStore } from '@/stores'
import { SpecDetails } from '@kong-ui-public/spec-renderer'
import '@kong-ui-public/spec-renderer/dist/style.css'

export default defineComponent({
  name: 'Spec',
  components: {
    SpecDetails,
    ViewSpecModal,
    ViewSpecRegistrationModal
  },
  props: {
    service: {
      type: Object,
      required: true
    }
  },
  setup (props) {
    const loading = ref(false)
    const spec = ref(null)
    const currentVersion = ref(null)
    const applicationRegistration = ref(null)
    const hasServiceError = ref(null)
    const viewSpecModalIsVisible = ref(false)
    const viewSpecRegistrationModalIsVisible = ref(false)
    const isAllowedToRegister = ref(false)
    const specContents = ref('')
    const serviceDoc = ref('')
    const serviceToc = ref('')
    const specName = ref('')
    const specDetails = ref(null)
    const serviceVersions = ref(new Map())
    const { canUserAccess } = usePermissionsStore()
    const appStore = useAppStore()
    const { isPublic } = storeToRefs(appStore)

    const applicationRegistrationEnabled = computed(() => {
      return !!applicationRegistration.value && isAllowedToRegister.value
    })

    const helpText = useI18nStore().state.helpText

    const servicePackageStore = useServicePackageStore()
    const { sidebarActiveOperation } = storeToRefs(servicePackageStore)

    const breadcrumbs = [{
      key: 'service-catalog',
      to: { name: 'catalog' },
      text: 'Catalog'
    }]

    const $router = useRouter()
    const $route = useRoute()
    const { portalApi, portalApiV2 } = usePortalApi()

    watch(() => props.service, async () => {
      isAllowedToRegister.value = await canUserAccess({
        service: 'konnect',
        action: '#consume',
        resourcePath: `services/${$route.params.service_package}`
      })

      await processService()
      await loadSwagger()

      // trigger registration modal if an application param is passed
      if ($route.query.application) {
        viewSpecRegistrationModalIsVisible.value = true
      }
    })

    watch(() => $route.params.service_version, async (serviceVersionId) => {
      if (serviceVersionId) {
        isAllowedToRegister.value = await canUserAccess({
          service: 'konnect',
          action: '#consume',
          resourcePath: `services/${$route.params.service_package}`
        })

        // this is not called on page load, but will be called when back button clicked and on select

        await loadSwagger()
      }
    })

    onMounted(async () => {
      isAllowedToRegister.value = await canUserAccess({
        service: 'konnect',
        action: '#consume',
        resourcePath: `services/${$route.params.service_package}`
      })

      await processService()
      await loadSwagger()

      // trigger registration modal if an application param is passed
      if ($route.query.application) {
        viewSpecRegistrationModalIsVisible.value = true
      }
    })

    function triggerViewSpecModal () {
      viewSpecModalIsVisible.value = true
      specContents.value = getSpecContents()
    }

    function triggerViewSpecRegistrationModal () {
      viewSpecRegistrationModalIsVisible.value = true
    }

    function closeModal () {
      viewSpecModalIsVisible.value = false
      viewSpecRegistrationModalIsVisible.value = false
    }

    function downloadSpecContents () {
      let extension
      let fileName
      const content = specContents.value
      const element = document.createElement('a')

      try {
        JSON.parse(content)
        extension = '.json'
      } catch (e) {
        extension = '.yaml'
      }

      if (window.location.pathname.includes('/')) {
        const splitPath = window.location.pathname.split('/')

        fileName = splitPath[splitPath.length - 1]
      } else {
        fileName = window.location.pathname
      }

      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(specContents.value))
      element.setAttribute('download', fileName + extension)
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }

    function getSpecContents () {
      return JSON.stringify(spec.value, null, 2)
    }

    function formatMarkdown (markdownString) {
      const slugify = (s) => encodeURIComponent('doc-' + String(s).trim().toLowerCase().replace(/\s+/g, '-'))
      const md = markdownIt({
        html: false,
        xhtmlOut: true,
        typographer: true
      })
        .use(markdownAnchor, {
          permalink: true,
          permalinkBefore: true,
          permalinkSpace: true,
          permalinkSymbol: '<svg width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg"><title>Permalink</title><path d="M4.29678 13.2891c-.96732-.9673-.96732-2.5399 0-3.5072l2.26275-2.26274-1.07481-1.07481L3.22198 8.7071c-1.56129 1.5613-1.56129 4.0956 0 5.6568 1.56129 1.5613 4.09556 1.5613 5.65686 0l2.26276-2.2627-1.0748-1.0748-2.26277 2.2627c-.96732.9674-2.53992.9674-3.50725 0zm2.885-1.7536l4.52552-4.52546-1.1314-1.13137-4.52549 4.52553 1.13137 1.1313zm1.69706-8.48526L6.61609 5.31298l1.07481 1.0748 2.26274-2.26274c.96736-.96732 2.53996-.96732 3.50726 0 .9673.96733.9673 2.53993 0 3.50725l-2.2628 2.26274 1.0748 1.07477 2.2628-2.2627c1.5613-1.5613 1.5613-4.09557 0-5.65686-1.5613-1.56129-4.0956-1.56129-5.65686 0z" fill="#000"/></svg>',
          slugify
        })
        .use(markdownToc, { slugify })

      const result = md.render(
        `\${toc}\n ${markdownString}`
      )

      let markdown = document.createElement('div')

      markdown.innerHTML = result
      let toc = markdown.querySelector('.table-of-contents')

      markdown.removeChild(toc)

      markdown = markdown.outerHTML
      toc = toc.outerHTML

      return { toc, markdown }
    }

    function setTitle (versionName) {
      const versionText = versionName ? `- ${versionName} ` : ''

      if (props.service) {
        document.title = `${props.service?.display_name ? props.service?.display_name : props.service?.name} ${versionText}| Developer Portal`
      } else {
        document.title = 'Developer Portal'
      }
    }

    // TODO(TDX-2419): Unnecessary after API Documentation is GA
    async function processService () {
      if (!props.service) {
        return
      }

      props.service.versions
        .slice()
        .sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        )
        .forEach(version => {
          serviceVersions.value.set(version.id, {
            id: version.id,
            version: version.version,
            deprecated: version.deprecated,
            dropdownLabel: `${version.version}${version.deprecated ? ' (Deprecated)' : ''}`
          })
        })

      if (props.service?.documents?.[0]) {
        const { toc, markdown } = formatMarkdown(props.service.documents[0].content)

        serviceDoc.value = markdown
        serviceToc.value = toc
      }
    }

    async function fetchApplicationRegistration (spec) {
      if (isPublic.value) {
        return
      }

      try {
        const res = await portalApi.value.client.get(`/portal_api/application_registrations/service_versions/${spec.id}`)

        applicationRegistration.value = res?.data
      } catch (e) {
        applicationRegistration.value = null
        console.error(e)
      }
    }

    async function fetchSpec (version) {
      loading.value = true

      return await portalApiV2.value.service.versionsApi.getProductVersionSpec({
        productId: $route.params.service_package,
        versionId: version
      })
        .then(async res => {
          // no content
          if (res.status === 204) {
            res.data = {}

            return res
          }

          const rawContent = res.data.content

          // first iteration - assume we were passed raw yaml
          try {
            res.data = await jsyaml.load(rawContent)
          } catch (error) {
            console.error('Failed to parse yaml', error)
          }

          // fallback - try to parse response content as json
          try {
            res.data = await JSON.parse(rawContent)
          } catch (error) {
            console.error('Failed to parse json', error)
          }

          return res
        })
        .catch(e => {
          return e.response
        })
        .finally(() => {
          loading.value = false
        })
    }

    async function loadSwagger () {
      if (!props.service) {
        return
      }

      const serviceVersion = $route.params.service_version
      const servicePackage = $route.params.service_package

      let serviceVersionId

      if (serviceVersion) {
        try {
          serviceVersionId = decodeURIComponent(serviceVersion)
        } catch (e) {
          serviceVersionId = serviceVersion
        }
      }

      if (!serviceVersionId && serviceVersions.value.size > 0) {
        // Redirect when missing service version id
        // to first available service version of service package
        const id = Array.from(serviceVersions.value).pop()[0]

        $router.replace({
          name: 'spec',
          params: {
            service_version: encodeURIComponent(id),
            service_package: servicePackage
          }
        })

        return // return because the route change will trigger load swagger again
      }

      const currentServiceVersion = serviceVersions.value.get(serviceVersionId)

      if (!currentServiceVersion && serviceVersions.value.size > 0) {
        // Fallback to previous implementation when we had serviceVersion name in url
        // instead of serviceVersion id. In that case variable serviceVersionId is serviceVersion name
        // Also it handles a situation when non-exisitng id/name will be provided

        const serviceVersion = Array.from(serviceVersions.value.values()).find((serviceVersion) => {
          return serviceVersion.version === serviceVersionId
        })

        $router.replace({
          name: 'spec',
          params: {
            service_version: serviceVersion?.id && encodeURIComponent(serviceVersion?.id),
            service_package: servicePackage
          }
        })

        return // return because the route change will trigger load swagger again
      }

      setTitle(currentServiceVersion?.version)

      if (currentServiceVersion) {
        currentVersion.value = currentServiceVersion
        await fetchApplicationRegistration(currentServiceVersion)
      }

      // if we have a service version, fetch the spec
      if (currentServiceVersion?.id && $route.params.service_package) {
        try {
          const specResponse = await fetchSpec(serviceVersionId)

          spec.value = specResponse.data

          // detect 404 for usage in swagger-ui-kong-theme-universal
          if (specResponse.status === 404 || specResponse.status === 204) {
            spec.value.statusCode = 404
          }

          if (specResponse.status !== 200 && specResponse.status !== 204) {
            throw Error(getMessageFromError(specResponse))
          }
        } catch (e) {
          console.error(e)
        }
      }
    }

    return {
      helpText,
      viewSpecModalIsVisible,
      viewSpecRegistrationModalIsVisible,
      specContents,
      specName,
      sidebarActiveOperation,
      spec,
      loading,
      currentVersion,
      hasServiceError,
      isPublic,
      breadcrumbs,
      downloadSpecContents,
      closeModal,
      specDetails,
      applicationRegistrationEnabled,
      triggerViewSpecModal,
      triggerViewSpecRegistrationModal
    }
  }
})
</script>

<style lang="scss">
.spec {
  .deprecated-alert {
    padding: 14px;
    font-family: inherit;
    font-size: 1rem;
    border-radius: 4px;
    color: var(--KAlertWarningColor, var(--yellow-500, color(yellow-500)));
    border-color: var(--KAlertWarningBorder, var(--yellow-200, color(yellow-200)));
    background-color: var(--KAlertWarningBackground, var(--yellow-100, color(yellow-100)));
  }

  .container .breadcrumbs {
    position: relative;
    left: var(--spacing-xs)
  }

  .swagger-ui .version-pragma {
    display: none;
  }

  .header-anchor {
    position: relative;

    svg {
      position: absolute;
      left: -1.5rem;
      bottom: 0;
    }
  }
}

.spec-loading-container {
  align-items: center;
  background-color: var(--white, #fff);
  display: flex;
  height: 100%;
  justify-content: center;
  left: 0;
  position: absolute;
  top: 0;
  width: 100%;
  z-index: 10000;
}

.spec.api-documentation .breadcrumbs {
  margin-left: 0;
}
</style>
