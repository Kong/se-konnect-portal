<template>
    <GraphiQL :fetcher="fetcher" style="margin-top: 56px !important;">
      <div style="margin-top: 56px !important;">
        
      </div>
    </GraphiQL>
  </template>
  <script>
  import {applyPureReactInVue} from 'veaury'
  // This is a React component
  import GraphiQL from 'graphiql'
  import { createGraphiQLFetcher } from '@graphiql/toolkit';
  import {ref} from 'vue'
  
  const fetcher = (url) => {
    const newfetcher = createGraphiQLFetcher({ url: url });
    console.log(newfetcher)
    return newfetcher
  }
  export default {
    components: {
      GraphiQL: applyPureReactInVue(GraphiQL)
      }
    ,
    props: {
      url: String
    },
    setup(props) {
      return {
        fetcher: ref(fetcher(props.url))
      }
    }
  }
  </script>
  
  <style scoped>
    @import "https://unpkg.com/graphiql/graphiql.min.css";
    </style>
<style>
        .graphiql-container {
            height: 100vh !important;
            margin-top: 56px !important;
        }
    </style>

