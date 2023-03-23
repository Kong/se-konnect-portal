import { THEMES, DEFAULT_FONTS } from '../fixtures/theme.constant'
const headers = {
  'Content-Type': 'application/json'
}

// Commenting out as we're skipping these tests.
// before(() => {
//   cy.setFeatureFlagOrgRelation({
//     flagId: '@flag/tdx/custom-catalog',
//     enabled: true
//   })
//   cy.toggleFeature({
//     flagId: '@flag/tdx/custom-catalog',
//     enabled: true,
//     flagType: 'experimental'
//   })
//   cy.loginKonnect()
//   cy.createDeveloperAndLogin()
//   cy.deleteAllPortalServices(headers)
// })

// after(() => {
//   cy.deleteAllPortalServices(headers)
//   cy.patchPortal({
//     use_custom_fonts: false,
//     fonts: null,
//     theme_name: 'mint_rocket',
//     catalog_cover: null,
//     custom_catalog: null
//   })
//   cy.setFeatureFlagOrgRelation({
//     flagId: '@flag/tdx/custom-catalog',
//     enabled: false
//   })
//   cy.toggleFeature({
//     flagId: '@flag/tdx/custom-catalog',
//     enabled: false,
//     flagType: 'experimental'
//   })
// })

describe.skip('loads color theme variables', () => {
  it('loads mint_rocket theme', () => {
    cy.patchPortal({ theme_name: 'mint_rocket' })
    cy.visit('/')
    cy.get('#site-header')
    cy.log('themes', THEMES)
    Object.keys(THEMES.mint_rocket).forEach(sectionName => {
      const section = THEMES.mint_rocket[sectionName]

      Object.keys(section).forEach(colorName => {
        const varName = `${sectionName}-${colorName}`
        const value = section[colorName].value

        cy.window().then(window => {
          return expect(window.getComputedStyle(window.document.documentElement).getPropertyValue(`--${varName}`)).to.contain(value)
        })
      })
    })
  })

  it('loads dark theme', () => {
    cy.patchPortal({ theme_name: 'dark_mode' })
    cy.visit('/')
    cy.get('#site-header')
    cy.log('themes', THEMES)
    Object.keys(THEMES.dark_mode).forEach(sectionName => {
      const section = THEMES.dark_mode[sectionName]

      Object.keys(section).forEach(colorName => {
        const varName = `${sectionName}-${colorName}`
        const value = section[colorName].value

        cy.window().then(window => {
          return expect(window.getComputedStyle(window.document.documentElement).getPropertyValue(`--${varName}`)).to.contain(value)
        })
      })
    })
  })
})

describe.skip('fonts', () => {
  it('loads default fonts', () => {
    cy.patchPortal({ use_custom_fonts: false })
    cy.visit('/')
    cy.get('#site-header')
    cy.get('body').should('have.css', 'font').should('contain', DEFAULT_FONTS.base)
  })

  it('loads custom fonts', () => {
    cy.patchPortal({
      use_custom_fonts: true,
      fonts: { base: 'Lobster', headings: 'Lato', code: 'Robto Mono' }
    })
    cy.visit('/')
    cy.get('#site-header')
    cy.get('body').should('have.css', 'font').should('contain', 'Lobster')
  })
})

describe.skip('custom Catalog', () => {
  it('loads default values', () => {
    cy.patchPortal({
      catalog_cover: null,
      custom_catalog: null
    })
    cy.visit('/')
    cy.get('#site-header')
    cy.get('.services-welcome').should('contain', 'Welcome to our service catalog')
    cy.get('.services-title').should('contain', 'Find All of Our Services in a Single Place')
    cy.get('.services-top-section').should('have.css', 'background-image').and('not.match', /catalog_cover/)
  })
  it('loads custom values', () => {
    cy.readFile('tests/e2e/kong-logo.png', 'base64').then(b => {
      cy.patchPortal({
        catalog_cover: `data:image/png;base64,${b}`,
        custom_catalog: { welcome_message: 'Hey Joe', primary_header: "where you goin' with that gun in your hand?" }
      })
      cy.visit('/')
      cy.get('#site-header')
      cy.get('.services-welcome').should('contain', 'Hey Joe')
      cy.get('.services-title').should('contain', "where you goin' with that gun in your hand?")
      cy.get('.services-top-section').should('have.css', 'background-image').and('match', /catalog_cover/)
    })
  })
})
