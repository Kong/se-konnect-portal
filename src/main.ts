import { createApp } from 'vue'
import piniaInstance, { useAppStore } from '@/stores'

import App from './App.vue'

import { portalRouter } from './router'
import { removeQueryParam } from './router/route-utils'

import useLaunchDarkly from '@/composables/useLaunchDarkly'

import { kongAuthApiBaseUrl, portalApi, session } from '@/services'

// Import kong-auth-elements, styles, and options interface
import { KongAuthElementsPlugin } from '@kong/kong-auth-elements/dist/kong-auth-elements.es'
import '@kong/kong-auth-elements/dist/style.css'
import handleKongAuthElementsError from '@/helpers/handleKongAuthElementsError'

// Globally import all Kongponents
import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'

import './assets/utilities.scss'
import './main.css'

// Globally defined components
import { registerComponents } from './components/registerComponents'

/**
 * Initialize application
 */

async function init () {
  const app = createApp(App)

  // Initialize the Pinia store
  app.use(piniaInstance)

  app.use(Kongponents)

  registerComponents(app)

  const [portalInfo, context] = await Promise.all([
    portalApi.client.get('/portal_api/portal/portal_info'),
    portalApi.client.get('/portal_api/portal/portal_context')
  ])

  const {
    portalId,
    orgId,
    launchDarklyClientId,
    basicAuthEnabled,
    oidcAuthEnabled,
    is_public: isPublic
  } = portalInfo.data
  const {
    is_dcr: isDcr,
    rbac_enabled: isRbacEnabled
  } = context.data

  if (isPublic === false) {
    portalApi.updateClientWithCredentials()
  }

  const { setPortalData, setSession } = useAppStore()

  const authClientConfig = { basicAuthEnabled, oidcAuthEnabled }

  setPortalData({ portalId, orgId, authClientConfig, launchDarklyClientId, isPublic, isDcr, isRbacEnabled })
  setSession(session)

  // Fetch session data from localStorage
  await session.saveData(session.fetchData())

  const router = portalRouter()

  if (!isPublic) {
    if (session.authenticatedWithIdp()) {
      let res

      try {
        res = await portalApi.client.get('/portal_api/userinfo')
      } catch (e) {
        // // catch error to prevent going directly to global api error handler
        res = { data: undefined }
        // remove loginSuccess to adjust session check
        removeQueryParam('loginSuccess')
      }

      await session.saveData({
        ...session.data,
        developer: res.data
      })
    }
  }

  const { initialize: initLaunchDarkly } = useLaunchDarkly()

  await initLaunchDarkly()

  app.use(router)

  // Register the kong-auth-elements Vue plugin
  app.use(KongAuthElementsPlugin, {
    apiBaseUrl: kongAuthApiBaseUrl,
    userEntity: 'developer',
    shadowDom: false,
    customErrorHandler: handleKongAuthElementsError,
    developerConfig: {
      portalId
    }
  })

  app.mount('#app')
}

init()
