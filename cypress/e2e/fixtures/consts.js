import { v4 as uuidv4 } from 'uuid'

const versions = [
  {
    created_at: '2022-03-26T14:52:46.323Z',
    updated_at: '2022-03-26T14:52:46.323Z',
    id: '1afac832-5b2a-474c-a56d-c241364f41cf',
    version: 'v1-beta',
    publish_status: 'published',
    deprecated: false
  }
]

const servicePackage = {
  created_at: '2022-03-23T14:52:41.893Z',
  updated_at: '2022-03-23T14:52:41.893Z',
  id: 'a5afb115-025e-4da1-a013-bf05b326e0a51',
  name: 'barAPI',
  display_name: 'barAPI',
  description: null,
  labels: {},
  documents: [
    {
      content: '# H1\n## H2\nHello World',
      created_at: '2022-03-29T13:44:14.349Z',
      id: '75572e8f-1bbf-4a5a-a2df-a6bd42b875d9',
      path: '/markdown.md',
      published: true,
      updated_at: '2022-03-29T13:44:14.349Z'
    }
  ],
  versions
}

const serviceVersion = {
  ...versions[0],
  publish_status: 'published',
  service_package: {
    created_at: '2022-03-25T10:52:19.442Z',
    id: servicePackage.id,
    name: 'barAPI',
    description: null,
    labels: {}
  }
}

const apps = [
  {
    name: 'My Cool App',
    description: 'My Cool App has a cool description',
    reference_id: '1',
    id: uuidv4(),
    registrations: []
  },
  {
    name: 'My Other App',
    reference_id: '2',
    id: uuidv4(),
    registrations: []
  },
  {
    name: 'My Other Other App',
    reference_id: '3',
    id: uuidv4(),
    registrations: []
  },
  {
    name: 'My DCR App',
    description: 'My DCR App has a cool description',
    redirect_uri: 'http://google.com',
    id: uuidv4(),
    registrations: []
  }
]

const serviceRegistration = {
  created_at: '2022-03-25T13:15:02.104Z',
  updated_at: '2022-03-25T13:15:02.104Z',
  id: 'f3081666-e388-41ac-a6c0-9f37de2c2102',
  status: 'approved',
  application: apps[1],
  service_version: serviceVersion
}

export { versions, servicePackage, serviceVersion, serviceRegistration, apps }
