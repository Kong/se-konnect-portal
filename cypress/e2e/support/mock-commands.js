// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

import { v4 as uuidv4 } from 'uuid'
import petstoreJson from '../fixtures/petstoreJson'
import generateServicePackages from './utils/generateServicePackages'
import { servicePackage } from '../fixtures/consts'
import document from '../fixtures/document.json'
import documentTreeJson from '../fixtures/documentTree.json'
import apiDocumentationJson from '../fixtures/parentApiDocumentation.json'
import petstoreOperatations from '../fixtures/petstoreOperations.json'

Cypress.Commands.add('mockPrivatePortal', (portalContext = {}, portalInfo = {}) => {
  cy.intercept('GET', '**/portal_api/portal/portal_context', {
    statusCode: 200,
    body: {
      is_public: false,
      is_dcr: false,
      ...portalContext
    },
    delay: 300
  })

  return cy.intercept('GET', '**/portal_api/portal/portal_info', {
    statusCode: 200,
    body: {
      theme: {
        colors: {
          'section_colors-header': '#F8F8F8',
          'section_colors-body': '#FFFFFF',
          'section_colors-hero': '#F8F8F8',
          'section_colors-accent': '#F8F8F8',
          'section_colors-tertiary': '#FFFFFF',
          'section_colors-stroke': 'rgba(0,0,0,0.1)',
          'section_colors-footer': '#07A88D',
          'text_colors-header': 'rgba(0,0,0,0.8)',
          'text_colors-hero': '#FFFFFF',
          'text_colors-headings': 'rgba(0,0,0,0.8)',
          'text_colors-primary': 'rgba(0,0,0,0.8)',
          'text_colors-secondary': 'rgba(0,0,0,0.8)',
          'text_colors-accent': '#07A88D',
          'text_colors-link': '#07A88D',
          'text_colors-footer': '#FFFFFF',
          'button_colors-primary-fill': '#1155CB',
          'button_colors-primary-text': '#FFFFFF'
        },
        font: {
          base: 'Roboto',
          code: 'Roboto Mono',
          headings: 'Lato'
        }
      },
      portalId: '123',
      orgId: '123',
      basicAuthEnabled: true,
      oidcAuthEnabled: false,
      featuresetId: '6202956f054d96149719eed0',
      is_public: false,
      ...portalInfo
    },
    delay: 300
  }).as('isPublicPortal')
})

Cypress.Commands.add('mockDcrPortal', () => {
  return cy.intercept('GET', '**/portal_api/portal/portal_context', {
    statusCode: 200,
    body: {
      is_public: false,
      is_dcr: true
    },
    delay: 300
  }).as('isDcrPortal')
})

Cypress.Commands.add('mockPublicPortal', () => {
  cy.intercept('GET', '**/portal_api/portal/portal_context', {
    statusCode: 200,
    body: {
      is_public: true,
      is_dcr: false
    },
    delay: 300
  })

  return cy.intercept('GET', '**/portal_api/portal/portal_info', {
    statusCode: 200,
    body: {
      theme: {
        colors: {
          'section_colors-header': '#F8F8F8',
          'section_colors-body': '#FFFFFF',
          'section_colors-hero': '#F8F8F8',
          'section_colors-accent': '#F8F8F8',
          'section_colors-tertiary': '#FFFFFF',
          'section_colors-stroke': 'rgba(0,0,0,0.1)',
          'section_colors-footer': '#07A88D',
          'text_colors-header': 'rgba(0,0,0,0.8)',
          'text_colors-hero': '#FFFFFF',
          'text_colors-headings': 'rgba(0,0,0,0.8)',
          'text_colors-primary': 'rgba(0,0,0,0.8)',
          'text_colors-secondary': 'rgba(0,0,0,0.8)',
          'text_colors-accent': '#07A88D',
          'text_colors-link': '#07A88D',
          'text_colors-footer': '#FFFFFF',
          'button_colors-primary-fill': '#1155CB',
          'button_colors-primary-text': '#FFFFFF'
        },
        font: {
          base: 'Roboto',
          code: 'Roboto Mono',
          headings: 'Lato'
        }
      },
      portalId: '123',
      orgId: '123',
      basicAuthEnabled: true,
      oidcAuthEnabled: false,
      featuresetId: '6202956f054d96149719eed0',
      is_public: true
    },
    delay: 300
  }).as('isMockedPublicPortal')
})

Cypress.Commands.add('mockSuccessfulDeveloperAuth', () => {
  return cy.intercept('POST', '**/kauth/api/v1/developer-authenticate', {
    statusCode: 200,
    body: {},
    delay: 300
  }).as('userAuthenticate')
})

Cypress.Commands.add('mockSuccessfulPasswordReset', () => {
  return cy.intercept('POST', '**/portal_api/developer/password-reset', {
    statusCode: 200,
    delay: 300
  }).as('sendPasswordReset')
})

Cypress.Commands.add('mockGetUserInfo', () => {
  return cy.intercept('GET', '**/api/v2/developer/me', {
    statusCode: 200,
    body: {
      created_at: '2022-12-06T21:37:15Z',
      full_name: 'test-name',
      id: '967ca69f-e098-46d1-a572-2e8c73aeb807',
      email: 'test-email@email.com',
      updated_at: '2023-04-13T15:05:02Z'
    },
    delay: 300
  }).as('getUserInfo')
})

Cypress.Commands.add('mockServiceDocument', (servicePackageId = '*', serviceVersionId = '*', options = { body: petstoreJson }) => {
  return cy.intercept('GET', `**/portal_api/service_packages/${servicePackageId}/service_versions/${serviceVersionId}/document`, {
    statusCode: 200,
    delay: 100,
    ...options
  }).as('getMockedServiceDocument')
})

Cypress.Commands.add('mockServicePackageDocumentTree', (servicePackageId = '*', options = { body: documentTreeJson }) => {
  return cy.intercept('GET', `**/portal_api/service_packages/${servicePackageId}/document_tree`, {
    statusCode: 200,
    delay: 100,
    ...options
  }).as('getMockServicePackageDocumentTree')
})

Cypress.Commands.add('mockServicePackageApiDocument', (servicePackageId = '*', options = { body: apiDocumentationJson }) => {
  return cy.intercept('GET', `**/portal_api/service_packages/${servicePackageId}/documents/parent-api-document`, {
    statusCode: 200,
    delay: 100,
    ...options
  }).as('getMockServicePackageApiDocument')
})

Cypress.Commands.add('mockServicePackage', (servicePackageId = '*', options = { body: servicePackage }) => {
  return cy.intercept('GET', `**/portal_api/service_packages/${servicePackageId}`, {
    statusCode: 200,
    delay: 100,
    ...options
  }).as('getServicePackage')
})

Cypress.Commands.overwrite('visit', (originalFn, ...options) => {
  if (options[1] && options[1].useOriginalFn) {
    originalFn(...options)
  } else {
    const developer = {
      id: '9ee6f0ef-35c2-495c-bb7b-836af45e1a6d',
      email: '62cd14@email.com'
    }

    window.localStorage.setItem(
      'konnect_portal_session',
      btoa(encodeURIComponent(JSON.stringify({ developer })))
    )

    cy.setCookie('CYPRESS_USER_SESSION_EXISTS', 'CYPRESS_USER_SESSION_EXISTS')

    cy.log('Visit with logged user')

    originalFn(...options)
  }
})

Cypress.Commands.add('mockApplications', (searchResults, totalCount) => {
  return cy.intercept('GET', '**/portal_api/applications', {
    body: { data: searchResults, count: totalCount }
  }).as('getApplications')
})

Cypress.Commands.add('mockServiceVersionApplicationRegistration', (version, config = {}) => {
  return cy.intercept(
    'GET',
    `**/portal_api/application_registrations/service_versions/${version.id}`, {
      body: {
        auth_config: { name: 'key-auth', config: {} },
        auto_approve: false,
        created_at: '2022-03-25T10:56:27.268Z',
        errors: [],
        id: 'fb4d83a5-ebf3-497c-b7a4-14aa152da470',
        service_version: version,
        status: 'enabled',
        updated_at: '2022-03-25T10:56:27.268Z',
        ...config
      }
    }).as('getServiceVersionApplicationRegistration')
})

Cypress.Commands.add('mockServicesCatalog', (count, options = []) => {
  const servicesData = generateServicePackages(count, options)

  cy.intercept('GET', '**/portal_api/search/service_catalog**', {
    statusCode: 200,
    body: { data: servicesData, count: servicesData.length },
    delay: 0
  }).as('serviceSearch')
})

Cypress.Commands.add('mockGetServicePackageDocumentBySlug', (servicePackageId, slug, options = {}) => {
  const docId = uuidv4()
  const revId = uuidv4()
  const time = new Date().toISOString()

  const resp = {
    document: {
      id: docId,
      activeRevisionId: revId,
      createdAt: time,
      modifiedAt: time,
      portalId: '08a7c50e-c9cb-4ab6-a683-16406a30cf91',
      slug: slug,
      status: 'published',
      ...options.document || {}
    },
    revision: {
      content: document,
      createdAt: time,
      documentId: docId,
      meta: {},
      revisionId: revId,
      title: 'Document title mock',
      ...options.revision || {}
    }
  }

  return cy.intercept(
    'GET',
    `**/portal_api/service_packages/${servicePackageId}/documents/${slug}`,
    resp
  ).as('servicePackageDocument')
})

Cypress.Commands.add('mockGetServicePackageDocuments', (servicePackageId, options = []) => {
  const docId = uuidv4()

  const resp = {
    documents: [
      ...options,
      {
        documentId: uuidv4(),
        parentDocumentId: null,
        portalId: '08a7c50e-c9cb-4ab6-a683-16406a30cf91',
        status: 'published',
        activeRevisionId: uuidv4(),
        slug: 'mock-document-1',
        title: 'Mock Document #1',
        meta: {},
        children: []
      },
      {
        documentId: uuidv4(),
        parentDocumentId: null,
        portalId: '08a7c50e-c9cb-4ab6-a683-16406a30cf91',
        status: 'published',
        activeRevisionId: uuidv4(),
        slug: 'mock-document-2',
        title: 'Mock Document #3',
        meta: {},
        children: []
      },
      {
        documentId: docId,
        parentDocumentId: null,
        portalId: '08a7c50e-c9cb-4ab6-a683-16406a30cf91',
        status: 'published',
        activeRevisionId: uuidv4(),
        slug: 'mock-document-3',
        title: 'Mock Document #3',
        meta: {},
        children: [
          {
            documentId: uuidv4(),
            parentDocumentId: docId,
            portalId: '08a7c50e-c9cb-4ab6-a683-16406a30cf91',
            status: 'published',
            activeRevisionId: uuidv4(),
            slug: 'child-document-1',
            title: 'Child Document #1',
            meta: {},
            children: []
          },
          {
            documentId: uuidv4(),
            parentDocumentId: docId,
            portalId: '08a7c50e-c9cb-4ab6-a683-16406a30cf91',
            status: 'published',
            activeRevisionId: uuidv4(),
            slug: 'child-document-2',
            title: 'Child Document #2',
            meta: {},
            children: []
          }
        ]
      }
    ]
  }

  return cy.intercept(
    'GET',
    `**/portal_api/service_packages/${servicePackageId}/documents`,
    resp
  ).as('servicePackageDocuments')
})

Cypress.Commands.add('mockGetServicePackageDocumentTree', (servicePackageId) => {
  const docId = uuidv4()

  return cy.intercept(
    'GET',
    `**/portal_api/service_packages/${servicePackageId}/document_tree`,
    {
      statusCode: 304,
      body: {}
    }
  ).as('ServicePackageDocumentTree')
})

Cypress.Commands.add('createNewApplication', (app, servicePackageId, versions) => {
  const selectors = {
    appRegModal: '[data-testid="application-registration-modal"]'
  }

  const submitButton = 'button[type="submit"]'

  cy.viewport(1440, 900)

  cy.mockServiceDocument()
  cy.mockApplications([], 0)

  cy.mockServicePackage(servicePackageId, { body: { id: servicePackageId, versions } })

  cy.mockServiceVersionApplicationRegistration(versions[0])

  cy.intercept('POST', '**/portal_api/applications', {
    body: {
      id: '1'
    }
  }).as('postApplicationRegistration')

  cy.mockPrivatePortal()

  cy.visit(`/spec/${servicePackageId}`)
  cy.get('.swagger-ui', { timeout: 12000 })
  cy.get('[data-testid="register-button"]', { timeout: 12000 })
    .click({ force: true })
  cy.get(selectors.appRegModal).should('exist')
  cy.get('[data-testid="create-application"]').click()
  cy.get('header h1').should('contain', 'Create New Application')

  cy.mockApplications([app], 1)
  cy.mockPrivatePortal()

  cy.get(submitButton).should('be.disabled')
  cy.get('#applicationName').type(app.name, { delay: 0 })
  cy.get('#referenceId').type(app.reference_id, { delay: 0 })
  cy.get(submitButton).should('not.be.disabled')
  cy.get(submitButton).click()

  cy.url().should('include', `/spec/${servicePackageId}`)
  cy.get(selectors.appRegModal).should('exist')
  cy.get(`${selectors.appRegModal} select`)
    .should('contain', app.name)

  return cy.document().then(document => {
    const params = (new URL(document.location)).searchParams

    return params.get('application')
  })
})

Cypress.Commands.add('mockServiceHasDocs', (hasDocumentation) => {
  cy.intercept('POST', '**/portal_api/service_packages/*/has_documentation', {
    body: { has_documentation: hasDocumentation }
  }).as('hasDocs')
})

Cypress.Commands.add('mockServiceOperations', (operations = petstoreOperatations) => {
  cy.intercept('get', '**/portal_api/service_packages/*/service_versions/*/operations', {
    body: petstoreOperatations
  }).as('operations')
})
