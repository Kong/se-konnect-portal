<template>
  <header
    id="site-header"
    class="flex items-center fixed w-full top-0 z-10"
  >
    <div class="w-100 container max-w-screen-2xl mx-auto flex justify-between items-center px-5 md:px-0">
      <router-link to="/">
        <img
          class="logo"
          :src="logoSrc"
          alt="logo"
        >
      </router-link>
      <nav class="flex items-center links">
        <router-link
          data-testid="catalog-link"
          :to="{ name: 'catalog' }"
          class="mr-2 p-2 catalog-link"
        >
          <div class="background-color-wrapper" />
          Catalog
        </router-link>

        <UserDropdown
          v-if="developer && !isPublic"
          :email="developer.email"
          @logout="logout"
        />
      </nav>
    </div>
  </header>
</template>

<script>
import { defineComponent } from 'vue'
import { mapState, storeToRefs } from 'pinia'
import { useAppStore } from '@/stores'
import path from 'path'
import UserDropdown from './UserDropdown'
import { portalApi } from '@/services'

export default defineComponent({
  name: 'Nav',
  components: { UserDropdown },
  setup () {
    const appStore = useAppStore()
    const { globalLoading } = storeToRefs(appStore)

    const logout = async () => {
      globalLoading.value = true

      const logoutUrl = await appStore.logout()

      window.location.href = logoutUrl
    }

    const logoSrc = portalApi.getApiLink('/portal_assets/logo')

    return {
      logout,
      logoSrc
    }
  },

  computed: {
    ...mapState(useAppStore, {
      developer: store => store.developerSession.data?.developer,
      isPublic: 'isPublic'
    })
  }

})
</script>

<style lang="scss" scoped>
.logo {
  max-height: 41px;
}

#site-header {
  height: var(--headerHeight);
  background-color: var(--section_colors-header);
  border-bottom: 1px solid var(--section_colors-stroke);

  .links a {
    color: var(--text_colors-header);
    &:hover{
      backdrop-filter: brightness(1.35);
    }
  }
}
</style>
