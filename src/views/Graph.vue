<!-- <template>
    <h1>Render My Graph</h1>
    <div id="renderme"></div>
  </template> -->
  <template>
    <div id="graphiql">Loading...</div>
  </template>
  
  <script lang="ts">
    // import { createGraphiQLFetcher } from '@graphiql/toolkit';
    // import { GraphiQL } from 'graphiql';
    // import React from 'react';
    // import { createRoot } from 'react-dom/client';
    // import 'graphiql/graphiql.css';

    // const root = createRoot(document.getElementById('graphiql'));
    //   root.render(
    //     React.createElement(GraphiQL, {
    //       fetcher: GraphiQL.createFetcher({
    //         url: 'https://swapi-graphql.netlify.app/.netlify/functions/index',
    //       }),
    //       defaultEditorToolsVisibility: true,
    //     }),
    //   );

    // const fetcher = createGraphiQLFetcher({ url: 'https://countries.trevorblades.com/graphql' });

    // const root = createRoot(document.getElementById('root'));
    // root.render(<GraphiQL fetcher={fetcher} />);
  import { defineComponent } from 'vue'
  import schema from "../assets/countries.json"
  
  export default defineComponent({
    name: 'Graph',
    props: {
        schema_url: {
            type: String
        }
    },  
    data() {
        return {
        // Just like JSX! Oh wait...
        
        }
    },
    mounted() {
        const root = ReactDOM.createRoot(document.getElementById('graphiql'));
        root.render(
            React.createElement(GraphiQL, {
            fetcher: GraphiQL.createFetcher({
                url: schema.schema,
            }),
            defaultEditorToolsVisibility: false,
            }),
        );
    },
  })
  </script>
  
  <style lang="scss" scoped>
    // @import url("https://unpkg.com/graphiql/graphiql.min.css");
    #graphiql {
        height: 100vh
    }

    // .CodeMirror-gutter-elt {
    //     width: auto !important;
    // }
    // .CodeMirror-line {
    //     margin-left: 15px !important
    // }
    // .CodeMirror-linenumber {
    //     left: 0 !important
    // }
  </style>
  