<template>
    <div class="products-content px-5">
      <div class="container max-w-screen-2xl mx-auto mt-6 mb-5 flex justify-between">
        <span class="products-label">GraphQL</span>
      </div>
      <div
        class="list-wrapper"
      >
      <div class="container max-w-screen-2xl mx-auto catalog-card-view">
        <div class="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          <GraphCatalogItem
            v-for="(product, index) in catalogItems"
            :key="product.id + index"
            class="catalog-item"
            :product="product"
            :has-documentation="product.documentCount > 0"
            :loading="loading"
          />
        </div>
      </div>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { PropType, defineComponent } from 'vue'
  import GraphCatalogItem from './GraphCatalogItem.vue'
  import { CatalogItemModel, useI18nStore } from '@/stores'

  const catalogItemsDefault = [
    {
        "id": "starwars",
        "title": "Star Wars API",
        "description": "This GraphQL API retrieves all the Star Wars data you've ever wanted: Planets, Spaceships, Vehicles, People, Films and Species from all seven Star Wars films.",
        "created_at": "2022-06-06T18:53:29.157Z",
        "updated_at": "2023-04-04T13:27:25.005Z",
        "version_count": 1,
        "document_count": 1,
        "latest_version": {
            "name": "1.0",
            "id": "7d2fcdd8-3f0e-4d28-bfe8-dcc21c533782"
        }
    },
    {
        "id": "countries",
        "title": "Countries API",
        "description": "This is a public GraphQL API for information about countries, continents, and languages.",
        "created_at": "2022-06-06T18:53:29.157Z",
        "updated_at": "2023-04-04T13:27:25.005Z",
        "version_count": 1,
        "document_count": 1,
        "latest_version": {
            "name": "1.0",
            "id": "7d2fcdd8-3f0e-4d28-bfe8-dcc21c533782"
        }
    }
  ]
  
  export default defineComponent({
    name: 'Catalog',
    components: {
      GraphCatalogItem
    },
    props: {
      catalogItems: {
        type: Array as PropType<CatalogItemModel[]>,
        default: catalogItemsDefault
      },
      cardsPerPage: {
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
      }
    },
    emits: ['list-page-changed', 'active-view-changed'],
    setup () {
      const helpText = useI18nStore().state.helpText.catalog
      const catalogTitle = helpText.entityTypeProduct
      const noResultsMessage = helpText.noResultsProduct
  
      return {
        helpText,
        catalogTitle,
        noResultsMessage
      }
    },
    data (): { activeView: 'grid' | 'table'} {
      return {
        activeView: 'grid'
      }
    },
    computed: {
      disabled () {
        return this.catalogItems.length === 0 ? true : null
      }
    },
    mounted () {
      const activeView = localStorage.getItem('portal-catalog-view') || 'grid'
  
      this.setActiveView(activeView)
    },
    methods: {
      setActiveView (val: 'grid' | 'table') {
        this.activeView = val
        localStorage.setItem('portal-catalog-view', val)
        this.$emit('active-view-changed', val)
      }
    }
  })
  </script>
  
  <style lang="scss" scoped>
  .list-wrapper {
    width: 100%;
  }
  
  .pagination-bar {
    // TODO: Kui variables
    margin-top: 16px;
  }
  
  .products-content {
    --grey-500: var(--button_colors-primary-fill);
    display: flex;
    flex-direction: column;
    align-items: center;
  
    .products-label {
      color: var(--text_colors-primary);
      font-size: var(--type-xl);
      font-weight: normal;
    }
  
    .view-switch-button {
      --grey-500: var(--text_colors-primary);
      --spacing-xs: 6px;
      --spacing-md: 6px;
      --KButtonOutlineBase: var(--section_colors-body);
      --KButtonOutlineBorder: var(--text_colors-primary);
      --KButtonOutlineHover: var(--section_colors-tertiary);
  
      border: 1px solid var(--KButtonOutlineBorder) !important;
    }
  }
  
  .product-catalog-empty-state {
    margin: auto;
    width: 20rem;
    display: block;
  }
  
  .product-catalog-loading-spinner {
    width: 100%;
    display: flex;
  }
  
  .product-catalog-no-products {
    text-align: center;
    padding: 20px var(--spacing-xs);
  }
  </style>
  