# Contributing

Thank you for your interest in contributing to Eld Blockchain Explorer. This document explains how to contribute to the project.

## Good first contributions

These areas are a solid place to start:

- **Improve an existing page or list** — clearer layout, denser or more readable presentation, better empty/error/loading states, additional useful fields from data already fetched.
- **Polish copy and consistency** — product naming (for example **capacity provider**), labels, and README / docs alignment with the live UI.
- **Tests for pure helpers** — assertions around formatting, parsing, or display utilities under `src/utils/` and `src/tests/`.

If you are unsure whether an idea fits, open an issue first and describe the intended user-facing change.

## Discuss internals before large work

Changes that touch core internals — for example routing/shell structure, shared data-fetching patterns in `src/hooks/`, env/config contracts, or CI quality gates — should be discussed with maintainers before you invest significant time. Open an issue or draft PR with the problem and proposed approach so scope and design can be agreed early.

## Development setup

See the [README](README.md) for prerequisites (Node.js >= 20), environment variables, and how to run the app:

```bash
npm install
cp .env.example .env.development
npm start
```

The toolchain version is pinned in [`.nvmrc`](.nvmrc) (Node 20). Use that version locally when possible so CI and local results match.

Calling production RPC/API hosts from `localhost` may fail CORS; prefer local backends, a same-origin proxy, or an allowlisted origin when testing against live data.

## Before you open a pull request

### Keep your branch current with `main`

Always rebase or merge the latest `main` into your branch before opening or updating a PR. That keeps history reviewable and avoids merge conflicts on GitHub:

```bash
git fetch origin
git merge origin/main
# or: git rebase origin/main
```

Resolve any conflicts locally, re-run the checks below, then push.

### Run the same checks as CI

GitHub Actions runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml), which executes `npm run ci`. Run that locally before you push or request review so failures surface on your machine first:

```bash
npm run ci
```

That runs, in order:

- `npm run format:check` (Prettier)
- `npm run lint` (ESLint)
- non-interactive tests (`CI=true npm test -- --watchAll=false`)
- `npm audit --omit=dev --audit-level=high`
- `npm run build`

Fix formatting with `npm run format` if the format check fails. Do not submit with lint or test failures.

## Pull request guidelines

- Prefer small, focused PRs that are easy to review. Small PRs are usually reviewed within a few days; larger ones may take longer.
- Describe **what** changed and **why** in the PR body. Link related issues when applicable.
- Match existing code style and folder boundaries (`pages/`, `components/`, `hooks/`, `utils/`, `config/`).
- Do not commit secrets — for example `.env`, `.env.development`, `.env.production`, or private validator admin status JSON maps.
- Ensure CI checks pass on the tip of your branch.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE) that covers this project.
