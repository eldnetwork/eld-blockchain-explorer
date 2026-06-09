# Eld Chain Explorer

Block explorer for the [Eld](https://eld.network) network, built with Create React App and React.

**Live site:** [https://explorer.eld.network](https://explorer.eld.network)

## Prerequisites

- [Node.js](https://nodejs.org/)

## Local development

```bash
npm install
cp .env.example .env.development
cp .env.example .env.production
npm start
```

Edit `.env.development` (and `.env.production` for builds) with your node RPC/API URLs. See `.env.example` for all variables.

For local validator admin status (optional, dev-only), copy the example config files:

```bash
cp src/config/validator-admin-status-urls.development.json.example \
   src/config/validator-admin-status-urls.development.json
cp src/config/validator-admin-status-urls.production.json.example \
   src/config/validator-admin-status-urls.production.json
```

Set `REACT_APP_ENABLE_VALIDATOR_ADMIN_STATUS=true` in `.env.development` to enable.

## Build

```bash
npm run build
```

Static output is written to the `build/` directory.
