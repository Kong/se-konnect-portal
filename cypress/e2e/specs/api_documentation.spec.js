import { servicePackage, serviceVersion } from '../fixtures/consts'
import apiDocumentationJson from '../fixtures/childrenApiDocumentation.json'

describe('Api Documentation Page', () => {
  beforeEach(() => {
    cy.mockPrivatePortal()
    cy.mockServicePackage(servicePackage.id)
    cy.mockGetServicePackageDocumentBySlug(servicePackage.id, 'bar')
    cy.mockGetServicePackageDocuments(servicePackage.id)
  })

  const PARENT_DOCUMENT_URL = `/docs/${servicePackage.id}/parent-api-document`
  const CHILD_DOCUMENT_URL = `/docs/${servicePackage.id}/parent-api-document/children-api-document`


  it('displays proper error message when 400', () => {
    cy.intercept(
      'GET',
      `**/portal_api/service_packages/${servicePackage.id}/documents/foo`,
      {
        statusCode: 500,
        body: {}
      }
    ).as('fetchServicePackageDocument')

    cy.visit(`/docs/${servicePackage.id}/foo`)

    cy.wait('@fetchServicePackageDocument')

    cy.get('[data-testid="api-documentation-page"]').should('be.visible')
    cy.get('[data-testid="error-wrapper"]').should('be.visible')
  })

  it('redirect when 404', () => {
    cy.intercept(
      'GET',
      `**/portal_api/service_packages/${servicePackage.id}/documents/foo`,
      {
        statusCode: 404,
        body: {}
      }
    ).as('fetchServicePackageDocument')

    cy.visit(`/docs/${servicePackage.id}/foo`)

    cy.wait('@fetchServicePackageDocument')

    cy.location('pathname').should('equal', '/404')
  })

  it('shows correct document tree in left sidebar of the catalog page for each service', () => {
    cy.mockServiceDocument()
    cy.mockServicePackageDocumentTree()

    cy.visit(`/spec/${servicePackage.id}/${serviceVersion.id}`)
    cy.wait('@getMockServicePackageDocumentTree')

    // verify if the parent document link is shown
    cy.get('a.title').contains('a', 'This is the parent document')
      .should('have.attr', 'href', PARENT_DOCUMENT_URL)
    cy.contains('This is the child document').should('not.be.visible')

    cy.get('.expand-button').click('topRight')

    // verify if the child document link is shown
    cy.get('a.title').contains('a', 'This is the child document')
      .should('have.attr', 'href', CHILD_DOCUMENT_URL)
    cy.contains('This is the child document').should('be.visible')
  })

  it('navigates to the correct API documentation page', () => {
    cy.mockServiceDocument()
    cy.mockServicePackageDocumentTree()
    cy.mockServicePackageApiDocument()

    cy.visit(`/spec/${servicePackage.id}/${serviceVersion.id}`)
    cy.wait('@getMockServicePackageDocumentTree')

    cy.get('a.title').contains('a', 'This is the parent document').click()
    cy.wait('@getMockServicePackageApiDocument')

    cy.url().should('include', PARENT_DOCUMENT_URL)
    cy.get('.k-breadcrumb-text').last().should('include.text', 'Documentation')
    cy.get('[data-testid="api-documentation-page"]').within(() => {
      cy.get('header h1').should('include.text', 'This is the parent document')
    })
  })

  it('shows correct document content', () => {
    cy.mockServicePackageApiDocument()

    cy.visit(PARENT_DOCUMENT_URL)

    // verify the content on main page
    cy.get('[data-testid="api-documentation-page"]').children('div').within(() => {
      cy.get('h1').should('include.text', 'This is the parent document')
      cy.get('p').first().should('include.text', 'Paragraphs are separated by a blank line.')
      cy.get('p').last().should('include.text', 'Line one')
      cy.get('h2').should('include.text', 'An h2 header')
      cy.get('h3').should('include.text', 'An h3 header')
      cy.get('li').last().should('include.text', 'Dump everything in the pot')
    })

    // verify the content in right-hand sidebar
    cy.get('[data-testid="api-documentation-page"]').children('aside').within(() => {
      cy.get('p').should('include.text', 'On this page')
      cy.get('li a').contains('An h1 header')
        .should('have.attr', 'href', '#doc-heading-an-h1-header')
      cy.get('li a').contains('An h2 header')
        .should('have.attr', 'href', '#doc-heading-an-h2-header')
      cy.get('li a').contains('An h3 header')
        .should('have.attr', 'href', '#doc-heading-an-h3-header')
    })
  })

  it('scrolls to the correct heading when a link is clicked in sidebar', () => {
    cy.intercept('GET', `**/portal_api/service_packages/${servicePackage.id}/documents/children-api-document`, {
      statusCode: 200,
      delay: 100,
      body: apiDocumentationJson
    })

    cy.visit(CHILD_DOCUMENT_URL)

    // heading at the top of the page
    cy.get('h1[id="doc-heading-child-document"]').should('be.visible')
    // heading at the bottom of the page
    cy.get('h3[id="doc-heading-an-h3-header"]').should('not.be.visible')

    cy.get('[data-testid="api-documentation-page"]').children('aside').within(() => {
      cy.get('li a').contains('An h3 header').click().then(() => {
        cy.url().then((url) => {
          expect(url).to.contain('#doc-heading-an-h3-header')
          // scrolling is flaky in the cypress chrome browser. Hence we are getting the url after clicking the header link and reloading the page
          cy.visit(url)
          cy.reload()
        })
      })
    })
    cy.get('h3[id="doc-heading-an-h3-header"]').should('be.visible')
    cy.get('h1[id="doc-heading-child-document"]').should('not.be.visible')
  })
})
