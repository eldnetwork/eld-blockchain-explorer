# Eld Blockchain Explorer

![Node](https://img.shields.io/badge/node-%3E%3D20-339933?logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=black)
![CRA](https://img.shields.io/badge/create--react--app-5-09D3AC?logo=createreactapp&logoColor=white)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![CI](https://github.com/eldnetwork/eld-blockchain-explorer/actions/workflows/ci.yml/badge.svg)](https://github.com/eldnetwork/eld-blockchain-explorer/actions/workflows/ci.yml)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fexplorer.eld.network)](https://explorer.eld.network)
[![Stars](https://img.shields.io/github/stars/eldnetwork/eld-blockchain-explorer)](https://github.com/eldnetwork/eld-blockchain-explorer/stargazers)

Block explorer UI for the [Eld](https://www.eld.network) decentralized ephemeral storage protocol, built with [Create React App](https://create-react-app.dev/) and React.

This repository is the public explorer frontend only — not the Eld protocol, node software, or SDKs. For protocol docs and the marketing site, see [Documentation](https://docs.eld.network) and [eld.network](https://www.eld.network).

**Live site:** [https://explorer.eld.network](https://explorer.eld.network)

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20

## Local development

```bash
npm install
cp .env.example .env.development
cp .env.example .env.production
npm start
```

This starts a local dev server at [http://localhost:3000](http://localhost:3000). Most changes reload automatically.

### Environment variables

Copy `.env.example` into `.env.development` (and `.env.production` for production builds), then set:

| Variable | Description |
| --- | --- |
| `REACT_APP_RPC_URL` | Tendermint / node RPC base URL |
| `REACT_APP_API_URL` | Explorer / indexer API base URL |
| `REACT_APP_FAUCET_URL` | Testnet faucet base URL |
| `REACT_APP_ENABLE_VALIDATOR_ADMIN_STATUS` | `true` to load optional validator admin status URLs (dev-oriented) |

For local validator admin status (optional), also copy the example config files:

```bash
cp src/config/validator-admin-status-urls.development.json.example \
   src/config/validator-admin-status-urls.development.json
cp src/config/validator-admin-status-urls.production.json.example \
   src/config/validator-admin-status-urls.production.json
```

## Build

```bash
npm run build
```

Static output is written to the `build/` directory.

To preview the production build locally:

```bash
npm run preview
```

## CI

```bash
npm run ci
```

Runs tests (non-interactive) and a production build.

## Links

- [Documentation](https://docs.eld.network)
- [Marketing site](https://www.eld.network)
- [X / Twitter](https://x.com/eld_network)

## License

MIT — see [LICENSE](LICENSE).

Font files in `src/fonts/` are [Ioskeley Mono](https://github.com/ahatem/IoskeleyMono), licensed under the SIL Open Font License 1.1 — see [src/fonts/LICENSE](src/fonts/LICENSE).
