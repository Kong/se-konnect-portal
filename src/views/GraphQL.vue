<template>
    <GraphiQL :url="url" :query="query"/>
</template>

<script>
import GraphiQL from '../components/GraphQL/GraphiQL.vue'

const productUrls = {
    starwars: {
        url: "https://swapi-graphql.netlify.app/.netlify/functions/index",
        query: `query Query {
    allFilms {
        films {
        title
        director
        releaseDate
        speciesConnection {
            species {
                name
                classification
                homeworld {
                    name
                }
            }
        }
        }
    }
}
        `
    },
    countries: {
        url: "https://countries.trevorblades.com/graphql",
        query: `query Query {
    country(code: "BR") {
        name
        native
        capital
        emoji
        currency
        languages {
            code
            name
        }
    }
}
        `
    }
}

export default {
    name: 'GraphQL',
    components: {
        GraphiQL
    },
    computed: {
        url () {
            if (this.$route.params.product) {
                return productUrls[this.$route.params.product].url
            }
        },
        query () {
            if (this.$route.params.product) {
                return productUrls[this.$route.params.product].query
            }
        }
    }
}
</script>

<style>
    #app {
        font-family: Avenir, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        color: #2c3e50;
        margin-top: 60px;
    }
</style>
