import { servicePackage, versions, serviceRegistration, apps } from '../fixtures/consts'

const mockApplicationWithCredAndReg = (
  data,
  credentials = [],
  registrations = { data: [] }
) => {
  cy.intercept('GET', `**/portal_api/applications/${data.id}`, {
    statusCode: 200,
    body: data
  }).as('getApplication')

  cy.intercept('GET', `**/portal_api/applications/${data.id}/credentials`, {
    statusCode: 200,
    body: { data: credentials }
  }).as('getApplicationCredentials')

  cy.intercept('GET', `**/portal_api/applications/${data.id}/registrations`, {
    statusCode: 200,
    body: registrations
  }).as('getApplicationRegistrations')
}

describe('Application Registration', () => {
  const selectors = {
    appRegModal: '[data-testid="application-registration-modal"]'
  }

  const credentials = [
    {
      id: '2433d1ba-1ba4-46d9-9c55-dde7cbcd8bd6',
      key: '4hloijU1YDWzeY003FKKZCeFUBNBXaxo'
    }
  ]

  const submitButton = 'button[type="submit"]'

  beforeEach(() => {
    cy.mockPrivatePortal()
  })

  it('displays empty dashboard for my apps', () => {
    cy.mockApplications([], 0)
    cy.visit('/my-apps')

    cy.get('[data-testid="create-application-button"]').should('exist')
    cy.get('[data-testid="create-application-link"]').should('exist')
    cy.get('[data-testid="empty-state-card"]')
      .should('exist')
      .should('contain', 'No Applications')
  })

  it('can create a new applications from spec page', () => {
    cy.createNewApplication(apps[0], servicePackage.id, versions)
  })

  it('can create an application with DCR for portal enabled', () => {
    cy.mockApplications([], 0)
    cy.mockDcrPortal()
    cy.visit('/my-apps')

    cy.get('[data-testid="create-application-button"]').should('exist')
    cy.get('[data-testid="create-application-link"]').should('exist')
    cy.get('[data-testid="create-application-button"]').click()

    cy.get('header h1').should('contain', 'Create New Application')
    cy.get(submitButton).should('be.disabled')
    cy.get('#applicationName').type(apps[3].name, { delay: 0 })
    cy.get('#description').type(apps[3].description, { delay: 0 })
    cy.get('#redirectUri').type(apps[3].redirect_uri, { delay: 0 })
    cy.get(submitButton).should('not.be.disabled')

    cy.intercept('POST', '**/portal_api/applications', {
      body: {
        id: apps[0].id,
        credentials: {
          client_id: 'your-client-id',
          client_secret: 'your-client-secret'
        }
      }
    }).as('postApplicationRegistration')
    mockApplicationWithCredAndReg(apps[3])

    cy.get(submitButton).click()

    cy.wait('@postApplicationRegistration').then(() => {
      cy.get('[data-testid="copy-secret-modal"]').should('exist')
      cy.get('[data-testid="copy-button"]').eq(0).should('exist').should('contain', 'your-client-id')
      cy.get('[data-testid="copy-button"]').eq(1).should('exist').should('contain', 'your-client-secret')
      cy.get('[data-testid="close-application-secret-modal"]').should('exist').click()

      cy.get('.k-alert.success').should('exist')
    })
  })

  it('can create a new application from my-apps dashboard', () => {
    cy.mockApplications(apps, 4)
    cy.visit('/my-apps')

    cy.get('[data-testid="create-application-button"]').click()

    cy.get('header h1').should('contain', 'Create New Application')
    cy.get(submitButton).should('be.disabled')
    cy.get('#applicationName').type(apps[0].name, { delay: 0 })
    cy.get('#description').type(apps[0].description, { delay: 0 })
    cy.get('#referenceId').type(apps[0].reference_id, { delay: 0 })
    cy.get(submitButton).should('not.be.disabled')

    cy.intercept('POST', '**/portal_api/applications', {
      body: {
        id: apps[0].id
      }
    }).as('postApplicationRegistration')
    mockApplicationWithCredAndReg(apps[0])

    cy.get(submitButton).click()

    cy.get('.k-alert.success').should('exist')
    cy.contains(apps[0].name)
    cy.contains(apps[0].description)
    cy.contains(apps[0].reference_id)
  })

  it('can generate reference Id via button', () => {
    cy.mockApplications(apps, 4)
    cy.visit('/my-apps')

    cy.get('[data-testid="create-application-button"]').click()

    cy.get('[data-testid="generate-reference-id"]').click()

    cy.get('#referenceId').should('not.have.value', '')
  })

  it('can return to My Apps from application details via breadcrumb', () => {
    cy.mockApplications(apps, 4)
    cy.visit('/my-apps')

    cy.get('[data-testid="applications-table"] tbody tr')
      .contains(apps[0].name)
      .click()

    mockApplicationWithCredAndReg(apps[0])

    cy.mockApplications(apps, 4)
    cy.get('.k-breadcrumbs .k-breadcrumbs-item a').contains('My Apps').click()
    cy.url().should('include', 'my-apps')
  })

  it('can edit an existing application', () => {
    cy.mockApplications(apps, 4)
    cy.visit('/my-apps')

    mockApplicationWithCredAndReg(apps[0])
    cy.get('[data-testid="applications-table"] tbody tr')
      .contains(apps[0].name)
      .click()

    cy.get('[data-testid="application-update-button"]').click()
    cy.get('header h1').should('contain', 'Update Application')

    cy.get('#applicationName').type('{end}z', { delay: 0 })

    cy.intercept('PATCH', `portal_api/applications/${apps[0].id}`, {
      statusCode: 200,
      body: { ...apps[0], name: apps[0].name + 'z' }
    }).as('getApplicationPatch')

    cy.intercept('GET', `portal_api/applications/${apps[0].id}`, {
      statusCode: 200,
      body: { ...apps[0], name: apps[0].name + 'z' }
    }).as('getApplication')

    cy.get(submitButton).click()
    cy.contains(apps[0].name + 'z')
  })

  it("doesn't display unhashed credentials column", () => {
    cy.mockApplications(apps, 4)
    cy.visit('/my-apps')

    mockApplicationWithCredAndReg(apps[0], [credentials[0]])

    cy.get('[data-testid="applications-table"] tbody tr')
      .contains(apps[0].name)
      .click()

    cy.get('[data-testid="credentials-list"] thead th').should('exist').should('not.contain', 'API Key')
  })

  it('can generate and copy credentials for application via modal', () => {
    cy.mockApplications(apps, 4)
    cy.visit('/my-apps')
    mockApplicationWithCredAndReg(apps[0])
    cy.get('[data-testid="applications-table"] tbody tr')
      .contains(apps[0].name)
      .click()

    cy.get('.credentials-list .empty-state-wrapper').should(
      'contain',
      'No Credentials'
    )

    cy.intercept('POST', `portal_api/applications/${apps[0].id}/credentials`, {
      statusCode: 201,
      body: {
        credential: 'credentialKey',
        id: 'id',
        display_name: 'display-name'
      }
    }).as('createApplicationCredentials')

    cy.intercept('GET', `portal_api/applications/${apps[0].id}/credentials`, {
      statusCode: 200,
      body: { data: [credentials[0]] }
    }).as('getApplicationCredentials')

    cy.get('[data-testid="generate-credential-button"]').click()
    cy.get('[data-testid="display-name-input"]').type('display-name').then(() => {
      cy.get('[data-testid="create-credential-modal-button"]').click()
      cy.wait('@createApplicationCredentials').then(() => {
        cy.get('[data-testid="copy-button"]').should('exist')
        cy.get('[data-testid="copy-credentials-confirm-modal-button"]').should('exist').click()
        cy.get('.toaster-container-outer .message').should(
          'contain',
          'copied to clipboard'
        )

        cy.get('[data-testid="credentials-list"] tbody tr')
          .should('exist')
          .should('have.length', 1)
      })
    })
  })

  it('display name is visible and editable, id is displayed', () => {
    cy.mockApplications(apps, 4)
    mockApplicationWithCredAndReg(apps[0], credentials)

    cy.visit('/my-apps')
    cy.get('[data-testid="applications-table"] tbody tr')
      .contains(apps[0].name)
      .click()

    cy.intercept('PATCH', `portal_api/applications/${apps[0].id}/credentials/${credentials[0].id}`, {
      statusCode: 200,
      body: {}
    }).as('updateApplicationCredential')

    cy.wait('@getApplicationCredentials').then(() => {
      // Mock the update call
      cy.intercept('GET', `portal_api/applications/${apps[0].id}/credentials`, {
        statusCode: 200,
        body: {
          data: [{
            id: credentials[0].id,
            key: credentials[0].key,
            display_name: 'new-display-name'
          }]
        }
      })
      cy.get('[data-testid="credentials-list"] tbody tr')
        .should('exist')
        .should('have.length', 1)
      cy.get('[data-testid="action-badge"]').click()
      cy.get('.k-popover-content .rename-item').click()
      cy.get('[data-testid="display-name-modal"]').should('exist')
      cy.get('[data-testid="rename-display-name-input"]').type('new-display-name{enter}')

      cy.wait('@updateApplicationCredential').then(() => {
        cy.get('[data-testid="credentials-list"] tbody tr').contains('new-display-name')
      })
    })
  })

  it('can generate and delete credentials for application', () => {
    cy.mockApplications(apps, 4)
    cy.visit('/my-apps')

    mockApplicationWithCredAndReg(apps[0])

    cy.get('[data-testid="applications-table"] tbody tr')
      .contains(apps[0].name)
      .click()

    cy.get('.credentials-list .empty-state-wrapper').should(
      'contain',
      'No Credentials'
    )

    cy.intercept('POST', `portal_api/applications/${apps[0].id}/credentials`, {
      statusCode: 201,
      body: {
        credential: 'credentialKey',
        id: 'id',
        display_name: 'display-name'
      }
    }).as('createApplicationCredentials')

    cy.intercept('GET', `portal_api/applications/${apps[0].id}/credentials`, {
      statusCode: 200,
      body: { data: [credentials[0]] }
    }).as('getApplicationCredentials')

    cy.get('[data-testid="generate-credential-button"]').click()
    cy.get('[data-testid="display-name-input"]').type('display-name').then(() => {
      cy.get('[data-testid="create-credential-modal-button"]').click()
      cy.wait('@createApplicationCredentials').then(() => {
        cy.get('[data-testid="copy-button"]').should('exist')
        cy.get('[data-testid="copy-credentials-confirm-modal-button"]').should('exist').click()
        cy.get('.toaster-container-outer .message').should(
          'contain',
          'copied to clipboard'
        )

        cy.get('[data-testid="credentials-list"] tbody tr')
          .should('exist')
          .should('have.length', 1)
      })

      cy.intercept(
        'DELETE',
        `portal_api/applications/${apps[0].id}/credentials/${credentials[0].id}`,
        {
          statusCode: 200
        }
      ).as('deleteApplicationCredentials')

      cy.intercept('GET', `portal_api/applications/${apps[0].id}/credentials`, {
        statusCode: 200,
        body: { data: [] }
      }).as('getApplicationCredentials')

      cy.get('[data-testid="action-badge"]').click()
      cy.get('.k-popover-content .delete-item').click({ force: true })
      cy.get('[data-testid="revoke-credential-modal"]').should('exist')
      cy.get('[data-testid="revoke-credential-modal-button"]').should('exist').click()
      cy.get('.credentials-list .empty-state-wrapper').should(
        'contain',
        'No Credentials'
      )
    })
  })

  it('can request registration to a service', () => {
    cy.mockServiceDocument()

    cy.mockServicePackage()

    cy.mockServiceVersionApplicationRegistration(versions[0])

    cy.viewport(1440, 900)
    cy.visit(`/spec/${servicePackage.id}`)
    cy.get('.swagger-ui', { timeout: 12000 })

    cy.mockApplications(apps, 4)

    cy.get('[data-testid="register-button"]', { timeout: 12000 }).click()
    cy.get(selectors.appRegModal).should('exist')
    cy.get(`${selectors.appRegModal} select`).should('contain', apps[0].name)

    cy.intercept(
      'POST',
      `/portal_api/applications/${apps[0].id}/registrations`,
      {
        body: {
          ...serviceRegistration,
          status: 'pending',
          application: apps[0]
        }
      }
    ).as('postApplicationRegistration')

    cy.get('[data-testid="submit-registration"]').click()
    cy.get(selectors.appRegModal).should(
      'contain',
      'You will be notified upon approval'
    )
  })

  it('can request registration to a service and is directed to application upon auto_approval', () => {
    cy.mockServiceDocument()

    cy.mockServicePackage()

    cy.mockServiceVersionApplicationRegistration(versions[0])

    cy.viewport(1440, 900)
    cy.visit(`/spec/${servicePackage.id}`)

    cy.mockApplications(
      [
        { ...apps[0], registrations: [serviceRegistration] },
        ...apps.slice(1, 2)
      ],
      3
    )

    cy.get('[data-testid="register-button"]', { timeout: 12000 }).click()
    cy.get(selectors.appRegModal).should('exist')
    cy.get(`${selectors.appRegModal} select`).should('contain', apps[1].name)

    cy.intercept(
      'POST',
      `/portal_api/applications/${apps[1].id}/registrations`,
      {
        body: serviceRegistration
      }
    ).as('postApplicationRegistration')

    mockApplicationWithCredAndReg(apps[1], [], {
      data: [serviceRegistration]
    })

    cy.get('[data-testid="submit-registration"]').click()

    cy.get('[data-testid="services-list"]')
    cy.get('[data-testid="services-list"]').should('contain', 'barAPI')
    cy.get('[data-testid="status-badge"]').should('contain', 'approved')
  })

  it('cannot duplicate a registration request', () => {
    cy.createNewApplication(apps[2], servicePackage.id, versions)
    cy.viewport(1440, 900)

    cy.mockServiceDocument()
    cy.visit(`/spec/${servicePackage.id}`).get('.swagger-ui', {
      timeout: 12000
    })
    cy.get('[data-testid="register-button"]', { timeout: 12000 })

    cy.mockApplications(
      [
        { ...apps[0], registrations: [serviceRegistration] },
        { ...apps[1], registrations: [serviceRegistration] },
        apps[2]
      ],
      3
    )

    cy.get('[data-testid="register-button"]').click()
    cy.get(`${selectors.appRegModal} select`)
      .contains(apps[0].name)
      .should('not.exist')
    cy.get(`${selectors.appRegModal} select`)
      .contains(apps[1].name)
      .should('not.exist')
    cy.get(`${selectors.appRegModal} select`).should('contain', apps[2].name)
    cy.get('[data-testid=create-application-2]').should('exist')
  })

  it('can delete an existing application', () => {
    cy.mockApplications(apps, 4)
    cy.visit('/my-apps')

    mockApplicationWithCredAndReg(apps[0])

    cy.get('[data-testid="applications-table"] tbody tr')
      .should('have.length', 4)
      .contains(apps[0].name)
      .click()

    cy.get('[data-testid="application-update-button"]').click()
    cy.get('header h1').should('contain', 'Update Application')

    // Delete and cancel during confirmation
    cy.get('[data-testid="application-delete-button"]').click()
    cy.get('[data-testid="application-delete-modal"]').should('exist')
    cy.get('[data-testid="application-delete-cancel-button"]').click()
    cy.get('[data-testid="application-delete-modal"]').should('not.exist')

    cy.intercept('DELETE', `portal_api/applications/${apps[0].id}`, {
      statusCode: 200
    }).as('deleteApplication')

    cy.mockApplications([...apps.slice(1)], 2)

    // Delete and confirm deletion
    cy.get('[data-testid="application-delete-button"]').click()
    cy.get('[data-testid="application-delete-modal"]').should('exist')
    cy.get('[data-testid="application-delete-confirm-button"]').click()

    cy.get('.toaster-container-outer .message').should(
      'contain',
      'Application successfully deleted'
    )

    cy.get('[data-testid="applications-table"] tbody tr')
      .should('have.length', 3)
      .contains(apps[0].name)
      .should('not.exist')
  })

  it("can't refresh token of existing application without dcr", () => {
    cy.mockApplications([apps[0]], 1)
    cy.visit('/my-apps')

    cy.get('[data-testid="applications-table"] tbody tr .actions-badge')
      .should('have.length', 1)
      .click()

    cy.get('[data-testid="dropdown-refresh-application-dcr-token"]').should('not.exist')
    cy.get('[data-testid="dropdown-delete-application"]').should('exist')
  })

  it('can refresh token of existing application with dcr', () => {
    cy.mockApplications([{ ...apps[0], is_dcr: true }], 1)
    cy.visit('/my-apps')

    cy.get('[data-testid="applications-table"] tbody tr .actions-badge')
      .should('have.length', 1)
      .click()

    cy.intercept('POST', `portal_api/applications/${apps[0].id}/refresh_token`, {
      statusCode: 200,
      body: { client_secret: 'SECRET_TOKEN' }
    }).as('refreshToken')

    cy.get('[data-testid="dropdown-delete-application"]').should('exist')
    cy.get('[data-testid="dropdown-refresh-application-dcr-token"]').should('exist').click()

    cy.wait('@refreshToken')

    cy.get('.toaster-container-outer .message').should(
      'contain',
      'Successfully refreshed secret'
    )

    cy.get('[data-testid="application-secret-token-modal"]').should('exist')
    cy.get('[data-testid="copy-button"]').should('contain', 'SECRET_TOKEN').click()

    cy.get('.toaster-container-outer .message').should(
      'contain',
      '"SECRET_TOKEN" copied to clipboard'
    )

    cy.get('[data-testid="close-btn"]').click()

    cy.get('[data-testid="application-secret-token-modal"]').should('not.exist')
  })

  it('can refresh token of existing application with dcr from application page', () => {
    cy.mockApplications([{ ...apps[0], is_dcr: true, created_at: '2022-11-02T18:59:30.789Z' }], 1)
    mockApplicationWithCredAndReg({ ...apps[0], is_dcr: true, created_at: '2022-11-02T18:59:30.789Z' })

    cy.intercept('GET', '**/portal_api/portal/portal_context', {
      is_dcr: true
    }).as('getPortalContext')
    cy.visit('/my-apps')

    cy.get('[data-testid="applications-table"] tbody tr').click()

    cy.intercept('POST', `portal_api/applications/${apps[0].id}/refresh_token`, {
      statusCode: 200,
      body: { client_secret: 'SECRET_TOKEN' }
    }).as('refreshToken')

    cy.wait('@getPortalContext')

    cy.get('[data-testid="client-secret-table"]').should('exist')
    cy.get('[data-testid="client-secret-table"] [data-testid="refresh-secret-button"]').should('exist').click()

    cy.wait('@refreshToken')

    cy.get('.toaster-container-outer .message').should(
      'contain',
      'Successfully refreshed secret'
    )

    cy.get('[data-testid="application-secret-token-modal"]').should('exist')
    cy.get('[data-testid="copy-button"]').should('contain', 'SECRET_TOKEN').click()

    cy.get('.toaster-container-outer .message').should(
      'contain',
      '"SECRET_TOKEN" copied to clipboard'
    )

    cy.get('[data-testid="close-btn"]').click()

    cy.get('[data-testid="application-secret-token-modal"]').should('not.exist')
  })

  it('show credentials table and not dcr secret table if portal is not dcr ', () => {
    cy.mockApplications([{ ...apps[0], is_dcr: true }], 1)
    mockApplicationWithCredAndReg({ ...apps[0], is_dcr: true })

    cy.intercept('GET', '**/portal_api/portal/portal_context', {
      is_dcr: false
    }).as('getPortalContext')
    cy.visit('/my-apps')

    cy.get('[data-testid="applications-table"] tbody tr').click()

    cy.wait('@getPortalContext')

    cy.intercept('POST', `portal_api/applications/${apps[0].id}/refresh_token`, {
      statusCode: 200,
      body: { client_secret: 'SECRET_TOKEN' }
    }).as('refreshToken')

    cy.get('[data-testid="client-secret-table"]').should('not.exist')
    cy.get('[data-testid="client-secret-table"] [data-testid="refresh-secret-button"]').should('not.exist')
    cy.get('.credentials-list').should('exist')
  })
})
