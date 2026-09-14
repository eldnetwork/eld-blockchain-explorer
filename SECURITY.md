# Security Policy

## Supported versions

Security fixes are applied to the latest code on `main`. If tagged releases exist, the most recent release is also considered supported.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Report them privately using [GitHub Security Advisories](https://github.com/eldnetwork/eld-blockchain-explorer/security/advisories/new):

1. Go to the repository’s **Security** tab.
2. Choose **Advisories** → **New draft security advisory** (or use the link above).
3. Include a clear description, steps to reproduce, affected versions if known, and any suggested fix.

We aim to acknowledge reports promptly, typically within a few days. After triage, we will work with you on a fix and coordinated disclosure when appropriate.

## Scope

This repository is the public Eld Blockchain Explorer (`https://explorer.eld.network`): a Create React App + React frontend that reads public RPC and indexer HTTP APIs and is deployed as static files.

In scope:

- Cross-site scripting or HTML injection in the explorer UI
- Open redirects or abuse of client-side routing / outbound links
- Secrets or credentials committed to this repository
- Supply-chain issues in this repo’s npm dependencies that affect the built site
- Compromised or unexpected behavior in the site’s CI workflow

Out of scope for this repository:

- The Eld protocol, node software, consensus, cryptography, or indexer backends (to be covered when those repos are public)
- Availability or correctness of public RPC / API data served by those backends
- `https://www.eld.network` and `https://docs.eld.network` except for links or copy hosted in this repo
- Third-party outages (GitHub, npm, CDN, DNS)
- Social-engineering against Eld accounts

If you are unsure whether a finding belongs here, report it privately through the advisory form above and we will route it.
