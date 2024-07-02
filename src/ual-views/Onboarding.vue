<template>
  <Content>
    <div class="w-1/2 mx-auto">
      <PageTitle
        :title="($route.meta.title as string)"
        class="mb-5"
      />
      <form>
          <div class="mb-5">
            <KLabel for="clientAppCI">
              Application CI <span class="text-danger">*</span>
            </KLabel>
            <KInput
              id="clientAppCI"
              v-model.trim="formData.clientAppCI"
              data-testid="client-app-ci-input"
              type="text"
              class="k-input--full"
            />
          </div>
          <div class="mb-5">
            <KLabel for="oamDomain">
              OAM Domain <span class="text-danger">*</span>
            </KLabel>
            <KInput
              id="oamDomain"
              v-model.trim="formData.oamDomain"
              data-testid="client-oam-domain-input"
              type="text"
              class="k-input--full"
            />
          </div>
          <div class="mb-5">
            <KLabel for="consumerUrl">
              Consumer URL<span class="text-danger">*</span>
            </KLabel>
            <KInput
              id="consumerUrl"
              v-model.trim="formData.consumerUrl"
              data-testid="consumer-url-input"
              type="text"
              class="k-input--full"
            />
          </div>
          <div class="mb-5">
            <KLabel for="environment">
              Environment<span class="text-danger">*</span>
            </KLabel>
            <KSelect

              appearance="select"
              v-model="formData.environment"
              :items="[{ label: 'Development', value: 'dev' }, { label: 'QA', value: 'qa' },
                      { label: 'Staging', value: 'stage' }]"
            />
          </div>
          <div class="flex">
            <div class="flex-1">
              <KButton
                :is-rounded="true"
                appearance="secondary"
                @click="handleCancel"
              >
                Cancel
              </KButton>
              <KButton
                :is-rounded="true"
                appearance="primary"
                class="mr-4"
                :disabled="null"
                @click="handleCreate"
              >
                Submit
              </KButton>
            </div>
          </div>
        </form>
        <KModal
          :title="modalTitle"
          :is-visible="currentState.matches('pending')"
          data-testid="application-delete-modal"
          action-button-text="Create"
          action-button-appearance="danger"
          class="confirm-modal"
          @canceled="send('CLICKED_CANCEL')"
        >
      <template #header-content>
        {{ modalTitle }}
      </template>
      <template #body-content>
        Do you wish create your application, {{ formData.clientAppCI }} - {{ formData.oamDomain }}?
      </template>
      <template #footer-content>
          <KButton
          :is-rounded="true"
          appearance="creation"
          data-testid="application-create-confirm-button"
          class="mr-3"
          @click="handleConfirmCreate">
          Yes
        </KButton>

        <KButton
          appearance="secondary"
          :is-rounded="true"
          data-testid="application-create-cancel-button"
          @click="send('CLICKED_CANCEL')"
        >
          No
        </KButton>
      </template>
    </KModal>
    <KModal
          title="Application Created"
          :is-visible="currentState.matches('success')"
          data-testid="application-create-modal"
          class="confirm-modal"
        >
      <template #header-content>
        {{ modalTitle }}
      </template>
      <template #body-content>
        <CopyButton
          label="Client Id:"
          :text-to-copy="clientId"
        />
        <CopyButton
          label="Client Secret:"
          :text-to-copy="clientSecret"
        />
      </template>
      <template #footer-content>
        <KButton
          appearance="primary"
          :is-rounded="true"
          data-testid="application-create-success-button"
          @click="send('CLICKED_CANCEL')"
        >
          OK
        </KButton>
      </template>
    </KModal>
    </div>
  </Content>
</template>
<script lang="ts">
  import { defineComponent, ref, onMounted } from 'vue'
  import PageTitle from '@/components/PageTitle.vue'
  import { useRouter } from 'vue-router'
  import { useMachine } from '@xstate/vue'
  import { createMachine } from 'xstate'
  import axios from 'axios'
  import { useUalStore } from '@/ual-stores/app'
  import useToaster from '../composables/useToaster'
  import CopyButton from '@/components/CopyButton.vue'

  export default defineComponent({
    name: 'OnboardingForm',
    components: { PageTitle, CopyButton },
    setup() {
        const $router = useRouter()
        const formData = ref(makeDefaultFormData())
        const client = axios.create({
          baseURL: useUalStore().kongGatewayBaseUrl,
          withCredentials: false,
          headers: {
            accept: 'application/json'
          }
        })

        function makeDefaultFormData() {
          const returnObject = {
            clientAppCI: '',
            oamDomain: '',
            consumerUrl: '',
            environment: '' // env:dev/qa/stg
          }
        return returnObject
      }

      const { state: currentState, send } = useMachine(
        createMachine({
          predictableActionArguments: true,
          id: 'applicationFormMachine',
          initial: 'idle',
          states: {
            idle: {
              on: {
                CLICKED_CREATE: 'pending'
              }
            },
            pending: { on: { CLICKED_CANCEL: 'idle', RESOVLED: 'success' } },
            success: { on: { CLICKED_CANCEL: 'idle' } }
          }
        })
      )

      const modalTitle = `Create OAM Application`
      const clientId = ref('')
      const clientSecret = ref('')

      onMounted(async() => {

      })



      const handleCancel = () => {
          $router.back()
      }

      const handleCreate = () => {
        send('CLICKED_CREATE')
      }

      const handleConfirmCreate = () => {
        client.post("/onboarding/oam/registerccfclient", {
            "client-appci": formData.value.clientAppCI,
            "api-oam-domain": formData.value.oamDomain
          }).then((res) => {
          postToHarness(res)
          send('RESOVLED')
        }, (rej) => {
          send('CLICKED_CANCEL')
          useToaster().notify({
            appearance: 'danger',
            message: rej
        })
        })
      }

      const postToHarness = (obj) => {
        obj.consumerUrl = formData.value.consumerUrl
        obj.environment = formData.value.environment

        // TODO: fetch the org id based on ApplicationCI
        client.post("/harness/gateway/pipeline/api/webhook/custom/v2", obj).then((res) => {
          clientId.value = obj.data.clientID
          clientSecret.value = obj.data.clientSecret

          useToaster().notify({
            appearance: 'success',
            message: "Post to Harness succeeded. Please check the output of your pipeline for status."
        })
        }, (rej) => {
          send('CLICKED_CANCEL')
          useToaster().notify({
            appearance: 'danger',
            message: rej
        })
        })
      }
      return {
        modalTitle,
        currentState,
        send,
        handleCancel,
        handleCreate,
        formData,
        handleConfirmCreate,
        clientId,
        clientSecret
      }
    }
  })
</script>