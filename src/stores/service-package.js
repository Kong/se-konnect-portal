import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useServicePackageStore = defineStore('service-package', () => {
  const servicePackage = ref(null)
  const documentTree = ref([])
  const activeDocumentSlug = ref(null)
  const activeDocumentId = ref(null)
  const activeServiceVersionId = ref(null)
  const sidebarActiveOperation = ref(null)

  const setServicePackage = (data) => {
    servicePackage.value = data
    documentTree.value = []
    activeServiceVersionId.value = null
  }

  const setDocumentTree = (data) => {
    documentTree.value = data
  }

  const setActiveDocumentSlug = (data) => {
    activeDocumentSlug.value = data
  }

  const setActiveDocumentId = (data) => {
    activeDocumentId.value = data
  }

  const setActiveServiceVersionId = (data) => {
    activeServiceVersionId.value = data
  }

  const setSidebarActiveOperation = (data) => {
    sidebarActiveOperation.value = data
  }

  return {
    servicePackage,
    documentTree,
    activeDocumentSlug,
    activeDocumentId,
    activeServiceVersionId,
    sidebarActiveOperation,

    setServicePackage,
    setDocumentTree,
    setActiveDocumentSlug,
    setActiveDocumentId,
    setActiveServiceVersionId,
    setSidebarActiveOperation
  }
})
