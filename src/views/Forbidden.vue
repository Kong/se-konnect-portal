<template>
  <Content>
    <section
      class="forbidden d-flex flex-column justify-content-center align-items-center"
      data-testid="forbidden"
    >
      <div>
        <img
          class="logo"
          src="/portal_assets/logo"
          alt="logo"
        >
      </div>

      <div class="circle d-flex align-items-center justify-content-center">
        403
      </div>

      <div class="message text-center">
        <h1 class="mb-1 type-xxl">
          Sorry. You are not authorized to view this page.
        </h1>
        <h1 class="mt-0 type-xxl">
          Go back
          <router-link
            data-testid="go-home"
            to="/"
          >
            home
          </router-link>.
        </h1>
      </div>
    </section>
  </Content>
</template>

<script>
export default {
  name: 'Forbidden'
}
</script>

<style lang="scss" scoped>
.forbidden {
  --timingFunction: cubic-bezier(.785, .135, .15, .86);
  height: calc(100vh - var(--headerHeight));

  h1,
  .circle {
    opacity: 0;
    animation: .75s var(--timingFunction) forwards fadeIn;
  }

  h1 { animation-delay: 1.25s; }
  .circle { animation-delay: 1s; }

  .circle {
    padding: 3rem;
    margin: 4rem 0;
    font-size: 2.5rem;
    border-radius: 50%;
    border: 1px solid var(--section_colors-stroke);
  }

  .logo {
    max-height: 41px;
  }
}

</style>
