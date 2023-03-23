<template>
  <div class="container max-w-screen-2xl mx-auto catalog-card-view">
    <div class="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      <CatalogItem
        v-for="service in services"
        :key="service.key"
        class="catalog-item"
        :service="service"
        :loading="loading"
        :show-documentation-link="showDocumentationLinks"
      />
    </div>
    <PaginationBar
      class="catalog-pagination mt-4"
      :page-size="pageSize"
      :total-count="totalCount"
      :search-triggered="searchTriggered"
      @pageChanged="onPageChanged"
    />
  </div>
</template>

<script>
import CatalogItem from './CatalogItem.vue'
import PaginationBar from './PaginationBar.vue'

export default {
  name: 'CatalogCardList',
  components: {
    CatalogItem,
    PaginationBar
  },
  props: {
    services: {
      type: Array,
      default: () => []
    },
    pageSize: {
      type: Number,
      default: 12
    },
    totalCount: {
      type: Number,
      default: 0
    },
    searchTriggered: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    showDocumentationLinks: {
      type: Boolean,
      default: false
    }
  },
  emits: ['page-changed'],
  methods: {
    onPageChanged (page) {
      this.$emit('page-changed', page)
    }
  }
}
</script>
