<template>
  <div class="credentials-list">
    <PageTitle class="mb-5">
      <h2 class="font-normal type-lg m-0">
        Authentication
      </h2>
      <template #right>
        <KButton
          data-testid="generate-credential-button"
          :is-rounded="false"
          appearance="secondary"
          @click="handleCreateCredential"
        >
          + {{ helpText.newButtonText }}
        </KButton>
      </template>
    </PageTitle>

    <KCard>
      <template #body>
        <KTable
          :is-loading="currentState.matches('pending')"
          data-testid="credentials-list"
          :fetcher-cache-key="fetcherCacheKey"
          :fetcher="fetcher"
          disable-pagination
          has-side-border
          is-small
          :headers="tableHeaders"
        >
          <template #key="{ row }">
            <CopyUUID
              :uuid="row.key"
              :truncated="false"
            />
          </template>
          <template #actions="{ row }">
            <ActionsDropdown>
              <template #content>
                <div
                  class="py-2 px-3 type-md cursor-pointer rename-item"
                  @click="handleRenameCredentialModal(row)"
                >
                  {{ helpText.renameModal.actionLabel }}
                </div>
                <div
                  class="py-2 px-3 type-md cursor-pointer delete-item"
                  @click="handleDeleteCredentialModal(row)"
                >
                  {{ helpText.revokeModal.revokeButton }}
                </div>
              </template>
            </ActionsDropdown>
          </template>

          <template #empty-state>
            <EmptyState
              :title="helpText.noCredentialsText"
            />
          </template>
        </KTable>
      </template>
    </KCard>
    <KModal
      :is-visible="deleteCredentialModalVisible"
      :title="helpText.revokeModal.title"
      data-testid="revoke-credential-modal"
      class="revoke-credential-modal"
      @canceled="handleCloseDeleteCredentialModal"
    >
      <template #body-content>
        <p class="copy-text">
          {{ helpText.revokeModal.description(deletedKeyRow.display_name ? deletedKeyRow.display_name : deletedKeyRow.id) }}
        </p>
      </template>
      <template #footer-content>
        <KButton
          :is-rounded="false"
          appearance="danger"
          class="mr-3"
          data-testid="revoke-credential-modal-button"
          @click="handleDeleteCredentialSubmit"
        >
          {{ helpText.revokeModal.revokeButton }}
        </KButton>
        <KButton
          appearance="secondary"
          :is-rounded="false"
          data-testid="revoke-credential-close-modal-button"
          @click="handleCloseDeleteCredentialModal"
        >
          {{ helpText.revokeModal.cancelButton }}
        </KButton>
      </template>
    </KModal>
    <DisplayNameModal
      :is-visible="displayNameModalVisible"
      :rename-key-row="renameKeyRow"
      @rename-credential="handleRenameCredentialSubmit"
      @create-new-credential="handleCredentialSubmit"
      @close-display-name-modal="handleCloseDisplayNameModal"
    />
    <KModal
      :is-visible="copyCredentialModalVisible"
      :title="helpText.copyModal.title"
      data-testid="copy-new-credential-modal"
      class="copy-credential-modal"
      @canceled="handleCloseCopyCredentialModal"
    >
      <template #header-content>
        {{ helpText.copyModal.title }}
      </template>
      <template #body-content>
        <p class="copy-text mb-5">
          {{ helpText.copyModal.hiddenCredentialsText }}
        </p>

        <p class="copy-text copy-label">
          <span>{{ helpText.copySubheading(copyCredentialDisplayName) }}</span>
        </p>

        <CopyButton
          class="copy-clipboard-button"
          :text-to-copy="credentialKey"
        />
      </template>
      <template #footer-content>
        <KClipboardProvider v-slot="{ copyToClipboard }">
          <KButton
            :is-rounded="false"
            appearance="primary"
            class="mr-3"
            data-testid="copy-credentials-confirm-modal-button"
            @click="copyTokenToClipboard(copyToClipboard)"
          >
            {{ helpText.copyModal.continueButton }}
          </KButton>
        </KClipboardProvider>
        <KButton
          :is-rounded="false"
          appearance="secondary"
          data-testid="copy-credentials-close-modal-button"
          @click="handleCloseCopyCredentialModal"
        >
          {{ helpText.copyModal.cancelButton }}
        </KButton>
      </template>
    </KModal>
  </div>
</template>

<script>
import { defineComponent, computed, ref } from 'vue'
import useToaster from '@/composables/useToaster'
import { useMachine } from '@xstate/vue'
import { createMachine } from 'xstate'
import getMessageFromError from '@/helpers/getMessageFromError'
import useLDFeatureFlag from '@/hooks/useLDFeatureFlag'
import { FeatureFlags } from '@/constants/feature-flags'

import { useI18nStore } from '@/stores'
import usePortalApi from '@/hooks/usePortalApi'
import PageTitle from '../../components/PageTitle'
import ActionsDropdown from '../../components/ActionsDropdown'
import CopyUUID from '../../components/CopyUUID'
import DisplayNameModal from '../../components/DisplayNameModal'
import CopyButton from '@/components/CopyButton'

export default defineComponent({
  name: 'CredentialsList',
  components: { PageTitle, ActionsDropdown, CopyUUID, CopyButton, DisplayNameModal },
  props: {
    id: {
      type: String,
      required: true
    }
  },

  setup (props) {
    const { notify } = useToaster()
    const helpText = useI18nStore().state.helpText.credentials

    const tableHeaders = [
      { label: 'Name', key: 'display_name' },
      { label: 'ID', key: 'id' },
      { key: 'actions', hideLabel: true }
    ]

    const copyCredentialModalVisible = ref(false)
    const displayNameModalVisible = ref(false)
    const deleteCredentialModalVisible = ref(false)
    const updatedDisplayName = ref('')
    const credentialKey = ref('')
    const copyCredentialDisplayName = ref('')
    const renameKeyRow = ref({})
    const deletedKeyRow = ref({})

    const { portalApiV2 } = usePortalApi()

    const { state: currentState, send } = useMachine(
      createMachine({
        predictableActionArguments: true,
        id: 'CredentialsMachine',
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

      return portalApiV2.value.service.credentialsApi.getManyCredentials({ applicationId: props.id }).then((res) => {
        send('RESOLVE')

        return {
          data: res.data.data,
          total: res.data.data.length
        }
      }).catch((e) => {
        return handleError(e)
      })
    }
    const handleCreateCredential = () => {
      displayNameModalVisible.value = true
    }

    const handleCredentialSubmit = (displayName) => {
      if (!displayName.value) {
        displayNameModalVisible.value = false

        return
      }

      portalApiV2.value.service.credentialsApi.createCredential({
        applicationId: props.id,
        createCredentialPayload: {
          display_name: displayName.value
        }
      })
        .then((res) => {
          displayNameModalVisible.value = false
          copyCredentialModalVisible.value = true
          copyCredentialDisplayName.value = res.data?.display_name ? res.data.display_name : res.data?.id
          credentialKey.value = res.data?.credential
          displayName.value = ''
          handleSuccess('created')
          revalidate()
        })
        .catch(error => {
          displayName.value = ''
          handleError(error)
        })
    }

    const handleRenameCredentialSubmit = (updatedDisplayName) => {
      if (!updatedDisplayName.value || updatedDisplayName.value === renameKeyRow.value.display_name) {
        displayNameModalVisible.value = false
        renameKeyRow.value = {}
        updatedDisplayName.value = ''

        return
      }

      portalApiV2.value.service.credentialsApi.updateCredential({
        applicationId: props.id,
        credentialId: renameKeyRow.value?.id,
        updateCredentialPayload: {
          display_name: updatedDisplayName.value
        }
      })
        .then(() => {
          displayNameModalVisible.value = false
          renameKeyRow.value = {}
          handleSuccess('updated', updatedDisplayName.value)
          updatedDisplayName.value = ''
          revalidate()
        })
        .catch((error) => {
          handleError(error)
        })
    }

    const handleDeleteCredentialSubmit = () => {
      portalApiV2.value.service.credentialsApi.deleteCredential({
        applicationId: props.id,
        credentialId: deletedKeyRow.value?.id
      })
        .then(() => {
          handleSuccess('revoked')
          deletedKeyRow.value = {}
          deleteCredentialModalVisible.value = false
          revalidate()
        })
        .catch(error => {
          handleError(error)
        })
    }

    const handleCloseDisplayNameModal = () => {
      displayNameModalVisible.value = false
      renameKeyRow.value = {}
    }

    const handleCloseCopyCredentialModal = () => {
      copyCredentialModalVisible.value = false
      credentialKey.value = ''
      copyCredentialDisplayName.value = ''
    }

    const handleCloseDeleteCredentialModal = () => {
      deleteCredentialModalVisible.value = false
      deletedKeyRow.value = {}
    }

    const handleDeleteCredentialModal = (keyRowValue) => {
      deleteCredentialModalVisible.value = true
      deletedKeyRow.value = keyRowValue
    }

    const handleRenameCredentialModal = (keyRowValue) => {
      displayNameModalVisible.value = true
      renameKeyRow.value = keyRowValue
    }

    const copyTokenToClipboard = (executeCopy) => {
      if (!executeCopy(credentialKey.value)) {
        notify({
          appearance: 'danger',
          message: `Failed to copy key: "${credentialKey.value}" to clipboard`
        })
      }

      notify({
        message: `Key "${credentialKey.value}" copied to clipboard`
      })

      copyCredentialModalVisible.value = false
      credentialKey.value = ''
    }

    const handleSuccess = (action, name) => {
      if (name) {
        notify({
          message: `Credential "${name}" successfully ${action}`
        })
      } else {
        notify({
          message: `Credential successfully ${action}`
        })
      }
    }

    const handleError = (error) => {
      notify({
        appearance: 'danger',
        message: getMessageFromError(error)
      })
      displayNameModalVisible.value = false
    }

    return {
      helpText,
      tableHeaders,
      currentState,
      credentialKey,
      deletedKeyRow,
      renameKeyRow,
      updatedDisplayName,
      copyCredentialDisplayName,
      copyTokenToClipboard,
      handleCloseCopyCredentialModal,
      handleCloseDisplayNameModal,
      handleCloseDeleteCredentialModal,
      handleDeleteCredentialModal,
      handleRenameCredentialModal,
      handleRenameCredentialSubmit,
      displayNameModalVisible,
      deleteCredentialModalVisible,
      copyCredentialModalVisible,
      handleCredentialSubmit,
      handleCreateCredential,
      handleDeleteCredentialSubmit,
      fetcherCacheKey,
      fetcher
    }
  }

})
</script>

<style lang="scss">
  .display-name-modal, .copy-credential-modal, .revoke-credential-modal {
    .k-modal-content {
      .k-modal-header {
        margin-left: unset;
        margin-right: unset;
      }
    }

    .k-modal-footer {
      &.modal-footer {
        justify-content: flex-end;
      }
    }

    .k-input-label {
      display: block;
      text-align: left;
      font-size: var(--type-md, 16px);
    }

    .display-name-input {
      .k-input {
        font-size: var(--type-md, 16px);
      }
    }
  }

  .copy-credential-modal {
    .copy-clipboard-button {
      margin-top: 0.5rem !important;

      .clipboard-button {
        padding: 10px 16px;
        padding-right: 8px;
        font-size: var(--type-md, 16px);
      }
    }
  }
</style>

<style lang="scss" scoped>
  .revoke-credential-modal, .copy-credential-modal {
    .copy-text {
      color: var(--black-70);
      text-align: left;
      font-size: var(--type-md, 16px);

      &.copy-label {
        color: var(--black-85);
        font-weight: 500;
      }
    }
  }
</style>
