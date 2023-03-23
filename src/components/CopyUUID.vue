<template>
  <div class="d-flex align-items-center">
    <div
      :title="uuid"
      data-testid="copy-id"
      class="d-flex"
    >
      <div :class="['uuid', truncated ? 'truncated-uuid' : '']">
        {{ uuid }}
      </div>
    </div>
    <KClipboardProvider v-slot="{ copyToClipboard }">
      <KButton
        appearance="btn-link"
        size="small"
        data-testid="copy-to-clipboard"
        @click="copyIdToClipboard(copyToClipboard)"
      >
        <KIcon
          title="Copy to clipboard"
          icon="copy"
          color="var(--steel-300)"
        />
      </KButton>
    </KClipboardProvider>
  </div>
</template>

<script>
import useToaster from '@/composables/useToaster'

const notifyTrimLength = 15

export default {
  props: {
    uuid: {
      type: String,
      required: true
    },
    truncated: {
      type: Boolean,
      required: false,
      default: true
    }
  },
  setup () {
    const { notify } = useToaster()

    const copyIdToClipboard = (executeCopy) => {
      if (!executeCopy(this.uuid)) {
        notify({
          appearance: 'danger',
          message: 'Failed to copy id to clipboard'
        })
      }

      notify({
        message: `"${this.uuid.substring(0, notifyTrimLength) + '...'}" copied to clipboard`
      })
    }

    return {
      copyIdToClipboard
    }
  }
}
</script>

<style lang="scss" scoped>
.k-button {
  --KButtonSecondaryBase: transparent;
  --KButtonSecondaryBorder: transparent;
  --KButtonSecondaryHover: transparent;
  --KButtonSecondaryHoverBorder: transparent;
  --KButtonSecondaryActive: transparent;
  --KButtonSecondaryActiveBorder: transparent;
  padding-bottom: 0.25rem !important;
  padding-top: 0.125rem !important;
  &:hover {
    text-decoration: none;
  }
}
.uuid {
  white-space: nowrap;
  padding-right: 0.75rem;
  &.truncated-uuid {
    max-width: 10ch;
    padding-right: 1ch;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
