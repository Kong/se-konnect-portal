<template>
  <div
    class="my-4"
  >
    <KTooltip
      label="Click to copy"
    >
      <KClipboardProvider v-slot="{ copyToClipboard }">
        <KButton
          :is-rounded="false"
          aria-label="Copy button content to clipboard"
          class="clipboard-button w-100 justify-content-between"
          data-testid="copy-button"
          appearance="secondary"
          @click="copyTokenToClipboard(copyToClipboard)"
        >
          <span>{{ label }} {{ textToCopy }}</span>
          <KIcon
            title="Copy to clipboard"
            icon="copy"
            color="var(--steel-300)"
          />
        </KButton>
      </KClipboardProvider>
    </KTooltip>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import useToaster from '@/composables/useToaster'

export default defineComponent({
  name: 'CopyButton',
  props: {
    textToCopy: {
      type: String,
      required: true
    },
    label: {
      type: String,
      default: ''
    }
  },
  setup (props) {
    const { notify } = useToaster()

    const copyTokenToClipboard = (executeCopy) => {
      if (!executeCopy(props.textToCopy)) {
        notify({
          appearance: 'danger',
          message: `Failed to copy ${props.textToCopy} to clipboard`
        })
      }

      notify({
        message: `"${props.textToCopy}" copied to clipboard`
      })
    }

    return {
      copyTokenToClipboard
    }
  }
})
</script>

<style lang="scss">
.clipboard-button {
  --KButtonFontSize: 12px;
}
</style>
