import ApiService from '@/services/ApiService'
import KongAuthApi from '@/services/KongAuthApi'
import SessionCookie from '@/services/SessionCookie'

/*
 * Set the base path for the KAuth API.
 * Unless using an absolute URL, this base path MUST start with a leading slash (if setting the default) in order to
 * properly resolve within container applications, especially when called from nested routes
 */

export const kongAuthApiBaseUrl = '/kauth'

export const baseUrl = import.meta.env.DEV ? '/' : import.meta.env.VITE_PORTAL_URL

export const portalApi = new ApiService(baseUrl)

export const kongAuthApi = new KongAuthApi(kongAuthApiBaseUrl)

export const session = new SessionCookie()

// Provide session to Konnect API and KAuth API instance
kongAuthApi.setSession(session)
portalApi.setSession(session)
