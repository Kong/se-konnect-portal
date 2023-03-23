<template>
  <Section
    v-if="documentTree.length && props.service"
    title="Overview"
  >
    <DocumentTree
      :documents="documentTree"
      :service-package-id="props.service.id"
      :active-document-id="activeDocumentId"
    />
  </Section>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import Section from './Section.vue'
import DocumentTree from '@/components/ApiDocumentation/DocumentTree'
import { useServicePackageStore } from '@/stores'

const props = defineProps({
  service: {
    type: Object,
    required: true
  }
})

const servicePackageStore = useServicePackageStore()
const { documentTree, activeDocumentId } = storeToRefs(servicePackageStore)

</script>

<style scoped>

</style>
