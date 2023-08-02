<template>
    <div>
      <div ref="graphiqlContainer"></div>
      <div v-if="showDocs" ref="docsContainer">
        <pre>{{ schemaSDL }}</pre>
      </div>
    </div>
  </template>
  
  <script>
  import {def} from 'vue';
  import GraphiQL from 'graphiql';
  import 'graphiql/graphiql.css';
  import { buildClientSchema, getIntrospectionQuery } from 'graphql';
  
  export default {
    name: 'GraphiQLWithDocs',
    props: {
      endpoint: {
        type: String,
        required: true
      },
      showDocs: {
        type: Boolean,
        default: true
      }
    },
    data() {
      return {
        schemaSDL: ''
      };
    },
    async mounted() {
      await this.initializeGraphiQL();
    },
    methods: {
      async initializeGraphiQL() {
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: getIntrospectionQuery() })
        });
        const { data } = await response.json();
        const schema = buildClientSchema(data);
        const graphiqlContainer = this.$refs.graphiqlContainer;
  
        const fetcher = async (graphQLParams) => {
          const result = await fetch(this.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(graphQLParams)
          });
          return result.json();
        };
  
        const introspectionResult = data; // Use the introspection result directly
        const schemaSDL = JSON.stringify(introspectionResult.__schema, null, 2);
        this.schemaSDL = schemaSDL;
  
        const graphiqlComponent = Vue.extend({
          render: (h) => h(GraphiQL, {
            props: {
              schema,
              fetcher
            }
          })
        });
  
        new graphiqlComponent().$mount(graphiqlContainer);
      }
    }
  };
  </script>
  
  <style scoped>
  pre {
    background-color: #f6f8fa;
    padding: 16px;
    border-radius: 4px;
    overflow: auto;
  }
  </style>
  