# AGENTS Guide
This guide is for coding agents working in this repository.
Follow local package conventions; there is no unified workspace script layer.

## Repository map
- `chat/`: Vue 3 + Vite + TypeScript frontend.
- `server/`: Express + Socket.IO + TypeScript backend.
- `ipfs-contract/`: Hardhat Solidity contracts and scripts.
- Root `package.json`: dependencies only, no root build/lint/test scripts.
- Frontend build output targets `server/public` (`chat/vite.config.ts`).

## Setup
Install dependencies per package:

```bash
cd chat && npm install
cd ../server && npm install
cd ../ipfs-contract && npm install
```

## Build/lint/test commands
Run from each package directory.

### Frontend (`chat`)
- Dev server: `npm run dev`
- Build (type-check + build): `npm run build`
- Build only: `npm run build-only`
- Type-check only: `npm run type-check`
- Lint (auto-fix): `npm run lint`
- Format source: `npm run format`
- Analyze bundle: `npm run analyze`

Frontend test notes:
- No `test` script currently exists in `chat/package.json`.
- Vitest deps are installed; if adding tests, run via `npx vitest`.
- Single test file: `npx vitest run src/path/to/file.test.ts`
- Single test name: `npx vitest run -t "test name"`

### Backend (`server`)
- Dev server: `npm run dev`
- Start compiled app: `npm run start`
- Build: `npm run build`
- Test suite: `npm run test`
- Lint (auto-fix): `npm run lint`

Single-test commands (Jest):
- Single file: `npx jest src/path/to/file.test.ts`
- Single test name: `npx jest -t "test name"`
- File + test name: `npx jest src/path/to/file.test.ts -t "test name"`

Backend test notes:
- No Jest config file found.
- No backend `*.test.ts` / `*.spec.ts` files currently exist.

### Contracts (`ipfs-contract`)
- `npm test` intentionally fails (`no test specified`).
- Use Hardhat commands directly:
  - Run all tests: `npx hardhat test`
  - Run single test file: `npx hardhat test test/StorageContract.js`
  - Run single test name: `npx hardhat test --grep "should ..."`
  - Start local chain: `npx hardhat node`
  - Deploy script: `npx hardhat run scripts/deploy.js --network localhost`

Contract notes:
- No `ipfs-contract/test/` directory currently exists.
- Deploy script updates frontend contract files (`abi.json` and `config.ts`).

## Recommended verification flow
Frontend-heavy change:
1. `cd chat && npm run type-check`
2. `cd chat && npm run lint`
3. `cd chat && npm run build`

Backend-heavy change:
1. `cd server && npm run lint`
2. `cd server && npm run build`
3. `cd server && npm run test` (once tests exist)

Contract-heavy change:
1. `cd ipfs-contract && npx hardhat compile`
2. `cd ipfs-contract && npx hardhat test`

## Code style guide
The repo is mixed-style; follow the local style in each package and file.

### Formatting and whitespace
Frontend (`chat`) enforced settings:
- `.editorconfig`: UTF-8, LF, 2 spaces, max line length 100.
- `.prettierrc.json`: `singleQuote: true`, `semi: false`.
- ESLint config: Vue essential + TypeScript recommended + Prettier compatibility.

Backend (`server`) observed settings:
- TypeScript `strict: true` (`server/tsconfig.json`).
- Semicolons are common.
- Indentation appears 2-4 spaces; keep edited files internally consistent.

Contracts (`ipfs-contract`) observed settings:
- Solidity uses 4-space indentation.
- JS scripts use CommonJS (`require`, `module.exports`).

### Imports
- Group order: external packages first, internal modules second.
- In frontend, prefer `@/` alias imports over long relative paths.
- Remove unused imports while editing touched files.
- Use `import type` for type-only imports where appropriate.

### Types and typing discipline
- Keep strict typing; avoid introducing new `any` unless unavoidable.
- Reuse existing domain types from `src/types`.
- Guard null/undefined values before dereferencing.
- Add explicit function return types when intent is not obvious.

### Naming conventions
- Vue composables/hooks: `useXxx`.
- Pinia stores: `useXxxStore`.
- Backend class names: PascalCase.
- Backend file suffixes: `*.controller.ts`, `*.service.ts`, `*.routes.ts`.
- Keep socket event naming aligned with existing constants/enums.

### Error handling
- Backend services may throw; controllers/middleware convert to HTTP responses.
- Keep centralized middleware behavior in `server/src/middlewares/errorHandler.ts`.
- In frontend async flows, use early guards and `try/catch`.
- Prefer project logger utilities over scattered raw `console.*` in new code.

### Environment and secrets
- Never commit secrets (JWT secrets, API tokens, private keys, wallet keys).
- Keep environment values in env files loaded by backend config.
- Treat `.env*` and key material as sensitive.

### Architecture and placement
- Frontend code should stay under `chat/src/{components,views,stores,hooks,lib,types}`.
- Preserve backend separation: routes -> controllers -> services.
- Keep socket infrastructure in `server/src/socket`.
- Keep contract/frontend sync steps in deployment scripts.

## Cursor and Copilot rules
Checked locations:
- `.cursorrules`
- `.cursor/rules/`
- `.github/copilot-instructions.md`

Current status:
- No Cursor rule files found.
- No Copilot instruction file found.

If these files are added later, treat them as high-priority constraints and update this guide.
