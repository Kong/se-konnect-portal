<template>
  <div class="services-list">
    <PageTitle class="mb-5">
      <h2 class="font-normal type-lg m-0">
        Services
      </h2>
    </PageTitle>
    <KCard>
      <template #body>
        <KTable
          data-testid="services-list"
          :fetcher-cache-key="fetcherCacheKey"
          :fetcher="fetcher"
          has-side-border
          :is-loading="currentState.matches('pending')"
          disable-pagination
          :headers="tableHeaders"
          is-clickable
          is-small
          @row:click="(_, row) => $router.push(row.specLink)"
        >
          <template #name="{ row }">
            {{ row.display_name ? row.display_name : row.name }}
          </template>
          <template #status="{ row }">
            <StatusBadge :status="row.status" />
          </template>
          <template #actions="{ row }">
            <ActionsDropdown>
              <template #content>
                <div
                  class="py-2 px-2 type-md cursor-pointer"
                  @click="handleDeleteRegistration(row.registrationId)"
                >
                  Unregister
                </div>
              </template>
            </ActionsDropdown>
          </template>
          <template #empty-state>
            <EmptyState
              message="No Services"
            >
              <template
                #title
              >
                No Services
              </template>
              <template #message>
                <div>
                  <router-link
                    :to="{ name: 'catalog' }"
                  >
                    View the catalog
                  </router-link> to register to a service.
                </div>
              </template>
            </EmptyState>
          </template>
        </KTable>
      </template>
    </KCard>
  </div>
</template>

<script>
import { defineComponent, computed, ref, onMounted } from 'vue'
import { useMachine } from '@xstate/vue'
import { createMachine } from 'xstate'
import getMessageFromError from '@/helpers/getMessageFromError'
import useToaster from '@/composables/useToaster'

import usePortalApi from '@/hooks/usePortalApi'
import PageTitle from '../../components/PageTitle'
import StatusBadge from '../../components/StatusBadge'
import ActionsDropdown from '../../components/ActionsDropdown'

export default {
  name: 'ServiceList',
  components: { PageTitle, StatusBadge, ActionsDropdown },
  props: {
    id: {
      type: String,
      required: true
    }
  },
  setup (props) {
    const { notify } = useToaster()
    const tableHeaders = [
      { label: 'Service', key: 'name' },
      { label: 'Version', key: 'version' },
      { label: 'Status', key: 'status' },
      { key: 'actions', hideLabel: true }
    ]

    const { portalApiV2 } = usePortalApi()

    const { state: currentState, send } = useMachine(
      createMachine({
        predictableActionArguments: true,
        id: 'ServiceList',
        initial: 'idle',
        states: {
          idle: { on: { FETCH: 'pending' } },
          pending: { on: { RESOLVE: 'success' } },
          success: { on: { FETCH: 'pending' } }
        }
      })
    )

    const key = ref(0)
    const fetcherCacheKey = computed(() => key.value.toString())

    const revalidate = () => {
      key.value += 1
    }

    const fetcher = async () => {
      send('FETCH')

      return portalApiV2.value.service.registrationsApi.getManyApplicationRegistrations({ applicationId: props.id })
        .then(({ data }) => {
          send('RESOLVE')

          return {
            data: data.data.map(registration => {
              return {
                name: registration.product_name,
                version: registration.product_version_name,
                id: registration.product_version_id,
                specLink: `/spec/${registration.product_id}/${registration.product_version_id}`,
                status: registration.status,
                registrationId: registration.id
              }
            }),
            total: data.meta.page.total
          }
        }).catch((e) => {
          handleError(e)
        })
    }


    const handleDeleteRegistration = (registrationId) => {
      portalApiV2.value.service.registrationsApi.deleteApplicationRegistration({
        applicationId: props.id,
        registrationId: registrationId
      })
        .then(() => {
          handleSuccess('unregistered')
          revalidate()
        })
        .catch(error => handleError(error))
    }

    const handleSuccess = (action) => {
      notify({
        message: `Successfully ${action}`
      })
    }

    const handleError = (error) => {
      notify({
        appearance: 'danger',
        message: getMessageFromError(error)
      })
    }

    return {
      tableHeaders,
      currentState,
      handleDeleteRegistration,
      fetcher,
      fetcherCacheKey
    }
  }
}
</script>
