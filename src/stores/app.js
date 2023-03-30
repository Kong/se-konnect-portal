import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const authTokenIsRefreshing = ref(false)
  const isPublic = ref(false)
  const isDcr = ref(false)
  const isRbacEnabled = ref(null)
  const globalLoading = ref(false)
  const portalId = ref(null)
  const orgId = ref(null)
  const developerSession = ref(null)
  const featuresetId = ref(null)
  const authClientConfig = ref(null)
  const logout = async (fullPath) => {
    return await developerSession.value.destroy(fullPath)
  }

  const setPortalData = (data) => {
    if (data.portalId) {
      portalId.value = data.portalId
    }

    if (data.orgId) {
      orgId.value = data.orgId
    }

    if (data.authClientConfig) {
      authClientConfig.value = data.authClientConfig
    }

    if (data.featuresetId) {
      featuresetId.value = data.featuresetId
    }

    if (data.isRbacEnabled) {
      isRbacEnabled.value = data.isRbacEnabled
    }

    if (data.isDcr) {
      isDcr.value = data.isDcr
    }

    if (data.isPublic) {
      isPublic.value = data.isPublic
    }
  }

  const setSession = (session) => {
    developerSession.value = session
  }

  return {
    authTokenIsRefreshing,
    isPublic,
    isDcr,
    isRbacEnabled,
    globalLoading,
    portalId,
    orgId,
    developerSession,
    featuresetId,
    authClientConfig,

    logout,
    setPortalData,
    setSession
  }
})
