# Project Guidelines

## Code Style
- TypeScript with TSLint; keep line length <= 180 and prefer single quotes.

## Architecture
- Entry point is `src/index.ts` with Koa app and router wiring.
- Route handlers live in `src/routers/` and map 1:1 to business domains.
- Persistence uses Mongoose schemas in `src/schemas/` with helpers in `src/db/`.
- Shared utilities are in `src/util/`.

## Build and Test
- `pnpm build` compiles TypeScript to `dist/`.
- `pnpm start:dev` runs the dev server with `config/dev.env`.
- `pnpm start:prod` runs the server with `config/prod.env`.
- `pnpm lint` runs TSLint.
- No automated tests are currently configured.

## Conventions
- Auth middleware is centralized in `src/util/auth.ts`; reuse it instead of re-implementing auth checks.
- Environment config is loaded from `config/dev.env` and `config/prod.env`.
