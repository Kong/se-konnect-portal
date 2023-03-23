import generateServicePackages from '../support/utils/generateServicePackages'
import { v4 as uuidv4 } from 'uuid'


const mockServiceSearchQuery = (searchQuery) => {
  const searchResults = [
    ['barAPI', ['v1-beta'], uuidv4()],
    ['fooApi', ['v1'], uuidv4()],
    ['sampleapi', ['v1'], uuidv4()],
    ['testapi', ['v1'], uuidv4()],
    ['xapi', ['v1'], uuidv4()]
  ]
    .filter((data) =>
      searchQuery !== '' ? JSON.stringify(data).includes(searchQuery) : true
    )
    .map(([name, versions, id]) => ({ source: { name, versions, id } }))

  cy.intercept('GET', '**/portal_api/search/service_catalog**', {
    statusCode: 200,
    body: { data: searchResults, count: searchResults.length },
    delay: 0
  }).as('serviceSearch')
}

const mockServiceSearchResults = (searchResults, totalCount) => {
  cy.intercept('GET', '**/portal_api/search/service_catalog**', {
    delay: 0,
    statusCode: 200,
    body: { data: searchResults, count: totalCount }
  }).as('serviceSearch')
}

describe('Catalog', () => {
  describe('Catalog card view', () => {
    before(() => {
      cy.mockPublicPortal()
      cy.mockServicesCatalog(1, [{ description: 'great description' }])
      cy.mockServiceHasDocs(true)

      cy.visit('/')
    })

    it('loads one service package', () => {
      cy.get('.catalog-item').should('have.length', 1)
    })

    it('loads Service package title', () => {
      cy.get('.catalog-item').contains('barAPI')
    })

    it('loads 1 service version', () => {
      cy.get('.catalog-item').contains('v2')
    })

    it('loads description', () => {
      cy.get('.catalog-item').contains('great description')
    })

    it('loads has title set', () => {
      cy.title().should('eq', 'Service Catalog | Developer Portal')
    })

    it('goes to details view on header click', () => {
      cy.mockPublicPortal()
      cy.mockServicePackage()
      cy.mockServiceHasDocs(false)

      cy.get('.catalog-item .services-card-title').first().click()
      cy.url().should('include', '/spec')
    })

    it('goes to details view on specification link click', () => {
      cy.mockPublicPortal()
      cy.mockServicePackage()
      cy.mockServicesCatalog(1, [{ description: 'great description' }])
      cy.mockServiceHasDocs(true)

      cy.visit('/')

      cy.get('.catalog-item .link').contains('Specification').click()
      cy.url().should('include', '/spec')
    })

    it('displays an empty state with no services', () => {
      cy.mockPublicPortal()
      cy.mockServicesCatalog(0)
      cy.mockServiceHasDocs(false)

      cy.visit('/')

      cy.get('.serv-catalog-no-services').should('have.length', 1)
    })

    it('disables view switcher with no services', () => {
      cy.mockPublicPortal()
      cy.mockServicesCatalog(0)
      cy.mockServiceHasDocs(false)

      cy.visit('/')

      cy.get('.serv-catalog-no-services').should('have.length', 1)
      cy.get('[data-testid="view-switcher"]').should('be.disabled')
    })

    it('renders the documentation link for catalog item', () => {
      cy.mockPrivatePortal()
      cy.mockServicesCatalog(1, [{ description: 'great description', hasDocumentation: true }])
      cy.mockServiceHasDocs(true)
      cy.visit('/')
      cy.wait('@hasDocs').then(() => {
        cy.get('.catalog-item .link').contains('Documentation').should('exist')
      })
    })
  })

  describe('Catalog table view', () => {
    before(() => {
      cy.mockPublicPortal()
      cy.mockServicesCatalog(13)
      cy.mockServiceHasDocs(false)
      cy.visit('/')
    })

    it('displays the table view', () => {
      cy.get('[data-testid="view-switcher"]:not(:disabled)')
        .click()
        .get('.k-table')
        .should('have.length', 1)
    })

    it('displays all of the entries', () => {
      cy.get('.k-table tbody td:nth-of-type(1)').should('have.length', 13)
    })

    it('goes to details view on click', () => {
      cy.mockPublicPortal()
      cy.get('.k-table tbody td:nth-of-type(1)').first().click()

      cy.mockServicePackage()

      cy.url().should('include', '/spec')
    })
    it('renders the documentation link for catalog item ', () => {
      cy.mockPrivatePortal()
      cy.mockServicesCatalog(1, [{ description: 'great description', hasDocumentation: true }])
      cy.mockServiceHasDocs(true)

      cy.visit('/')

      cy.get('[data-testid="view-switcher"]:not(:disabled)')
        .click()
        .get('.k-table')
        .should('have.length', 1)

      cy.get('.k-table thead th').contains('Details').should('exist')
      cy.get('.k-table tbody td:nth-of-type(4) a').contains('Specification').should('exist')
      cy.get('.k-table tbody td:nth-of-type(4) a').contains('Documentation').should('exist')
    })
  })

  describe('Catalog versions', () => {
    beforeEach(() => {
      cy.mockPublicPortal()
      cy.mockServiceHasDocs(false)
    })

    it('displays most recent created_at version', () => {
      cy.mockServicesCatalog(1, [{
        versions: [
          {
            created_at: '2022-03-23T12:41:09.371Z',
            updated_at: '2022-03-23T12:41:09.371Z',
            id: '6159b9be-bfbc-4f30-bd22-df720f6dcf90',
            version: 'v4',
            publish_status: 'published',
            deprecated: false
          },
          {
            created_at: '2022-03-23T11:46:35.613Z',
            updated_at: '2022-03-23T11:46:35.613Z',
            id: 'b820d3eb-5b70-47e5-8d97-9436a8021282',
            version: 'v1-beta',
            publish_status: 'published',
            deprecated: false
          }
        ]
      }])

      cy.visit('/')
      cy.get('.service-version').should('have.length', 1).contains('v4')
      cy.get('[data-testid="view-switcher"]:not(:disabled)')
        .click()
        .get('.k-table tbody tr:first-child td:nth-child(3)')
        .should('have.length', 1)
        .contains('v4')
      cy.get('[data-testid="view-switcher"]:not(:disabled)').click()
    })

    it('displays most recent created_at regardless of version name', () => {
      cy.get('.service-version').should('have.length', 1).contains('v4')

      cy.mockServicesCatalog(1, [{
        versions: [
          {
            created_at: '2022-03-23T12:41:09.371Z',
            updated_at: '2022-03-23T12:41:09.371Z',
            id: '6159b9be-bfbc-4f30-bd22-df720f6dcf90',
            version: 'v4',
            publish_status: 'published',
            deprecated: false
          },
          {
            created_at: '2022-03-24T11:46:35.613Z',
            updated_at: '2022-03-24T11:46:35.613Z',
            id: 'b820d3eb-5b70-47e5-8d97-9436a8021282',
            version: 'v1-beta',
            publish_status: 'published',
            deprecated: false
          }
        ]
      }])

      cy.get('[data-testid="view-switcher"]:not(:disabled)')
        .click()
        .get('.k-table tbody tr:first-child td:nth-child(3)')
        .should('have.length', 1)
        .contains('v1-beta')
      cy.get('[data-testid="view-switcher"]:not(:disabled)').click()
    })
  })

  describe('Catalog search', () => {
    before(() => {
      cy.mockPublicPortal()
      mockServiceSearchQuery('')
      cy.mockServiceHasDocs(false)
      cy.visit('/')
    })

    it('loads all service packages', () => {
      cy.get('.catalog-item').should('have.length', 5)
    })

    it('searches when search button clicked', () => {
      const searchQuery = 'x'

      mockServiceSearchQuery(searchQuery)

      cy.get('[data-testid=catalog-search]').type(searchQuery)
      cy.get('[data-testid=catalog-search-button]').click()
      cy.wait('@serviceSearch').then(() => {
        cy.get('.catalog-item').should('have.length', 1)
        cy.get('[data-testid=catalog-search]').type('{backspace}')
      })
    })

    it('searches when {enter} is typed', () => {
      const searchQuery = 'x'

      mockServiceSearchQuery(searchQuery)

      cy.get('[data-testid=catalog-search]').type(searchQuery + '{enter}')
      cy.wait('@serviceSearch').then(() => {
        cy.get('.catalog-item').should('have.length', 1)
        cy.get('[data-testid=catalog-search]').type('{backspace}')
      })
    })

    it('shows multiple results when searching', () => {
      const searchQuery = 's'

      mockServiceSearchQuery(searchQuery)
      cy.get('[data-testid=catalog-search]').type(searchQuery)
      cy.get('[data-testid=catalog-search-button]').click()
      cy.wait('@serviceSearch').then(() => {
        cy.get('.catalog-item').should('have.length', 2)
        cy.get('[data-testid=catalog-search]').type('{backspace}')
      })
    })

    it('updates table entries when searching', () => {
      const searchQuery = 's'


      mockServiceSearchQuery('')
      cy.get('[data-testid=catalog-search]').type('{enter}')
      cy.get('[data-testid="view-switcher"]:not(:disabled)')
        .click()
        .get('.k-table tbody td:nth-of-type(1)')
        .should('have.length', 5)

      mockServiceSearchQuery(searchQuery)
      cy.get('[data-testid=catalog-search]').type(searchQuery)
      cy.get('[data-testid=catalog-search]').type('{enter}')
      cy.wait('@serviceSearch').then(() => {
        cy.get('.k-table tbody td:nth-of-type(1)').should('have.length', 2)
      })
    })
    it('updates the table entries when clearing the field', () => {
      const searchQuery = 's'

      mockServiceSearchQuery(searchQuery)
      cy.get('[data-testid=catalog-search]').type(searchQuery)
      cy.get('[data-testid=catalog-search]').type('{enter}')
      cy.wait('@serviceSearch').then(() => {
        cy.get('.k-table tbody td:nth-of-type(1)').should('have.length', 2)
      })
      mockServiceSearchQuery('')
      cy.get('[data-testid=catalog-search]').trigger('search')
      cy.wait('@serviceSearch').then(() => {
        cy.get('.k-table tbody td:nth-of-type(1)').should('have.length', 5)
      })
    })
  })

  describe('Create a lot of services', () => {
    const totalServiceCount = 37
    const servicesData = generateServicePackages(37)

    describe('Catalog search', () => {
      before(() => {
        cy.mockPublicPortal()
        cy.mockServiceHasDocs(false)
      })

      it('shows 12 services', () => {
        mockServiceSearchResults(servicesData.slice(0, 12), totalServiceCount)
        cy.visit('/')
        cy.get('.catalog-item').should('have.length', 12)
      })

      it('does not display pagination bar if few enough results', () => {
        mockServiceSearchResults(servicesData.slice(12, 24), totalServiceCount)
        cy.get('.card-pagination-bar [data-testid=pagination-forwards]')
          .click()
          .get('.card-pagination-bar')
          .contains('13 - 24 of 37')

        const searchQuery = 'barAPI22'

        mockServiceSearchResults(
          servicesData.filter((s) => s.source.name === searchQuery),
          1
        )
        cy.get('[data-testid=catalog-search]').type(searchQuery + '{enter}')

        cy.wait('@serviceSearch').then(() => {
          cy.get('.catalog-item').should('have.length', 1)
          cy.get('.card-pagination-bar').should('not.exist')

          const searchInput = cy.get('[data-testid=catalog-search]')

          for (let i = 0; i < searchQuery.length; i++) {
            searchInput.type('{backspace}')
          }
        })
      })

      it('returns to first page on search', () => {
        mockServiceSearchResults(servicesData, totalServiceCount)
        cy.mockServiceHasDocs(false)
        cy.get('[data-testid=catalog-search]').type('{enter}')
        cy.get('.card-pagination-bar [data-testid=pagination-forwards]')
          .click()
          .get('.card-pagination-bar')
          .contains('13 - 24 of 37')

        const searchQuery = 'API'

        mockServiceSearchResults(servicesData.slice(0, 12), 13)
        cy.get('[data-testid=catalog-search]').type(searchQuery + '{enter}')
        cy.wait('@serviceSearch')
          .its('response.url')
          .should('contain', 'offset=0')
          .then(() => {
            cy.get('.catalog-item').should('have.length', 12)
            cy.get('.card-pagination-bar')
              .should('have.length', 1)
              .get('.card-pagination-bar')
              .contains('1 - 12 of 13')
          })
      })

      it('sets offset back to 0 when switching to table view', () => {
        mockServiceSearchResults(servicesData, totalServiceCount)
        cy.mockServiceHasDocs(false)
        cy.get('[data-testid=catalog-search]').type('{enter}')
        cy.get('.card-pagination-bar [data-testid=pagination-forwards]')
          .click()
          .get('.card-pagination-bar')
          .contains('13 - 24 of 37')

        cy.get('[data-testid="view-switcher"]:not(:disabled)').click()

        mockServiceSearchResults(servicesData, servicesData.length)
        cy.wait('@serviceSearch')
          .its('response.url')
          .should('contain', 'offset=0')
      })
    })

    describe('Catalog card list pagination', () => {
      before(() => {
        cy.mockPublicPortal()
        cy.mockServicesCatalog(totalServiceCount)
        cy.mockServiceHasDocs(false)
      })

      it('shows 12 services', () => {
        mockServiceSearchResults(servicesData.slice(0, 12), totalServiceCount)
        cy.visit('/')
        cy.wait('@serviceSearch').then(() => {
          cy.get('.catalog-item').should('have.length', 12)
        })
      })

      it('shows pagination bar', () => {
        cy.get('.card-pagination-bar')
          .should('have.length', 1)
          .get('.card-pagination-bar')
          .contains('1 - 12 of 37')
      })

      it('allows next page and back', () => {
        // forwards
        mockServiceSearchResults(servicesData.slice(0, 12), totalServiceCount)
        cy.get('.card-pagination-bar [data-testid=pagination-forwards]').click()
        cy.get('.card-pagination-bar').contains('13 - 24 of 37')
        // backwards
        mockServiceSearchResults(servicesData.slice(0, 12), totalServiceCount)
        cy.get('.card-pagination-bar [data-testid=pagination-backwards]').click()
        cy.get('.card-pagination-bar')
          .contains('1 - 12 of 37')
          .get('.catalog-item')
          .should('have.length', 12)
        // to last page
        mockServiceSearchResults(servicesData.slice(0, 1), totalServiceCount)
        cy.get('.card-pagination-bar [data-testid=pagination-forwards]')
          .click()
          .get('.card-pagination-bar [data-testid=pagination-forwards]')
          .click()
          .get('.card-pagination-bar [data-testid=pagination-forwards]')
          .click()
          .get('.card-pagination-bar [data-testid=pagination-forwards]')
          .click()
          .get('.card-pagination-bar')
          .contains('37 - 37 of 37')
          .get('.catalog-item')
          .should('have.length', 1)
      })

      it('allows go to first page and go to last page', () => {
        cy.mockServiceHasDocs(false)

        // forwards
        mockServiceSearchResults(servicesData.slice(0, 12), totalServiceCount)
        cy.get('.card-pagination-bar [data-testid=pagination-forwards]').click()
        mockServiceSearchResults(servicesData.slice(0, 12), totalServiceCount)
        cy.get('.card-pagination-bar [data-testid=pagination-forwards]').click()
        // to first page
        mockServiceSearchResults(servicesData.slice(0, 12), totalServiceCount)
        cy.get('.card-pagination-bar [data-testid=pagination-first]')
          .click()
          .get('.card-pagination-bar')
          .contains('1 - 12 of 37')
          .get('.catalog-item')
          .should('have.length', 12)
        // to last page
        mockServiceSearchResults(servicesData.slice(0, 1), totalServiceCount)
        cy.get('.card-pagination-bar [data-testid=pagination-last]')
          .click()
          .get('.card-pagination-bar')
          .contains('37 - 37 of 37')
          .get('.catalog-item')
          .should('have.length', 1)
      })
    })
  })
})
