<template>
  <AuthCard v-if="isBasicAuthEnabled">
    <!-- Kong Auth Element requires the wrapper with corresponding id attribute -->
    <div id="kong-auth-register-wrapper">
      <kong-auth-register
        wrapper-id="kong-auth-register-wrapper"
        :register-request-endpoint="registerEndpoint"
        register-button-text="Create Account"
        @register-success="onRegisterSuccess"
      />
    </div>
    <template
      #below-card
    >
      <div class="mt-6 text-center">
        <p class="color-text_colors-primary">
          {{ helpText.registration.alreadyCreated }}
          <router-link
            :to="{ name: 'login' }"
          >
            {{ helpText.registration.login }} &rarr;
          </router-link>
        </p>
      </div>
    </template>
  </AuthCard>
</template>

<script>
import { storeToRefs } from 'pinia'
import { defineComponent, computed, onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'
import usePortalApi from '@/hooks/usePortalApi'
import AuthCard from '../components/AuthCard'
import { useI18nStore, useAppStore } from '@/stores'

export default defineComponent({
  name: 'Registration',
  components: {
    AuthCard
  },
  setup () {
    const helpText = useI18nStore().state.helpText
    const $router = useRouter()

    const appStore = useAppStore()
    const { authClientConfig } = storeToRefs(appStore)
    const isBasicAuthEnabled = computed(() => authClientConfig.value.basicAuthEnabled)
    const { portalApi } = usePortalApi()

    function onRegisterSuccess () {
      $router.push({ path: '/login', query: { registered: true } })
    }

    onBeforeMount(() => {
      if (!isBasicAuthEnabled.value) {
        $router.push({ path: '/login' })
      }
    })

    return {
      registerEndpoint: portalApi.value.getApiLink('/portal_api/developer'),
      onRegisterSuccess,
      isBasicAuthEnabled,
      helpText
    }
  }
})
</script>
