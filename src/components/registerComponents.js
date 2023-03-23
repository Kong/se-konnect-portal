import Content from './Content'
import EmptyState from './EmptyState'

export const registerComponents = (app) => {
  app.component('Content', Content)
  app.component('EmptyState', EmptyState)
}
