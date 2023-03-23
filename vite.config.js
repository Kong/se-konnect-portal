/* eslint-disable no-console */
import { defineConfig, loadEnv } from 'vite'
import dns from 'dns'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { createHtmlPlugin } from 'vite-plugin-html'

const path = require('path')

function mutateCookieAttributes (proxy) {
  proxy.on('proxyRes', function (proxyRes, req, res) {
    if (proxyRes.headers['set-cookie']) {
      proxyRes.headers['set-cookie'] = (proxyRes.headers['set-cookie']).map(h => {
        return h.replace(/Domain=.*;/, 'Domain=localhost;').replace(/Secure; /, '')
      })
    }
  })
}

function setHostHeader (proxy) {
  const host = new URL(process.env.VITE_PORTAL_URL).hostname

  proxy.on('proxyReq', function (proxyRes) {
    proxyRes.setHeader('host', host)
  })
}

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) }

  const portalApiUrl = process.env.VITE_PORTAL_URL

  // required to prevent localhost from being rendered as 127.0.0.1
  dns.setDefaultResultOrder('verbatim')

  return defineConfig({
    plugins: [
      vue(
        {
          template: {
            transformAssetUrls: {
              includeAbsolute: false
            }
          }
        }
      ),
      vueJsx(),
      svgLoader(),
      createHtmlPlugin({
        minify: true,
        inject: {
          data: {
            apiURL: portalApiUrl
          }
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      },
      preserveSymlinks: true,
      /**
       * List of file extensions to try for imports that omit extensions. Note it is NOT recommended to omit extensions for custom import types (e.g. .vue) since it can interfere with IDE and type support.
       * TODO: This is a crutch as we need to add `.vue` to all component imports.
       * https://vitejs.dev/config/#resolve-extensions
       */
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
    },
    server: {
      proxy: {
        '^/kauth': {
          target: portalApiUrl,
          changeOrigin: true,
          configure: (proxy, options) => {
            mutateCookieAttributes(proxy)
          }
        },
        '^/portal_api': {
          target: portalApiUrl,
          changeOrigin: true,
          rewrite: (path) => (path.replace(/^\/portal-api/, '/')),
          configure: (proxy, options) => {
            mutateCookieAttributes(proxy)
            setHostHeader(proxy)
          }
        },
        '^/api': {
          target: portalApiUrl,
          changeOrigin: true,
          rewrite: (path) => (path.replace(/^\/api/, '/api')),
          configure: (proxy, options) => {
            mutateCookieAttributes(proxy)
            setHostHeader(proxy)
          }
        },
        '^/portal_assets': {
          target: portalApiUrl,
          changeOrigin: true,
          configure: (proxy, options) => {
            mutateCookieAttributes(proxy)
            setHostHeader(proxy)
          }
        }
      }
    }
  })
}
