import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUalStore = defineStore('ual', () => {
    const kongGatewayBaseUrl = ref('https://konggateway.dev.eii.aws.ual.com')

    return {
        kongGatewayBaseUrl
    }
})