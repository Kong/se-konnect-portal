# Konnect Portal Client

This repo is the OSS Konnect Portal Client, you may use this as a starting point for you own custom Konnect Portal that consumes the Konnect Portal API.
## How to run

Install dependencies

```bash
yarn 
```

Set PORTAL_URL in .env, this should match either the Kong supplied portal URL ending in `portal.konghq.com` or the custom Portal URL set in Konnect. Be sure to set the Custom Client domain to match the domain you will be serving the portal out of to avoid CORS issues.

For Development you can provide any portal URL, it is proxied by Vite,so you do not need to set the custom client domain.

Run vite dev with

```bash
yarn dev
```

Build production bundle with

```bash
yarn build
```
