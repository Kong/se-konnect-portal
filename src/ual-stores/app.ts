import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUalStore = defineStore('ual', () => {
    const kongGatewayBaseUrl = ref('http://localhost:8000')

    return {
        kongGatewayBaseUrl
    }
})