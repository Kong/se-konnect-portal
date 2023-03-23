import { portalApi } from '@/services'
import { ref } from 'vue'

export default function usePortalApi () {
  const api = ref(portalApi)

  return {
    portalApi: api
  }
}
