# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm** (`pnpm-workspace.yaml` pins `allowBuilds: bcrypt`); Node version from `.nvmrc` (20.20.2).

```bash
pnpm build          # tsc --rootDir ./src/  -> dist/
pnpm lint           # tslint (warnings only, see Code style)
pnpm start:dev      # nodemon + ts-node with config/dev.env
pnpm start:prod     # nodemon + ts-node with config/prod.env
npx tsc --noEmit    # type-check without emitting
```

`config/dev.env` and `config/prod.env` are **gitignored** — a fresh clone must create them. Required keys:
`MONGODB_URI`, `PUBLIC_KEY` (JWT secret), `PORT`, `DEBUG_MODE` (`true` enables mongoose query logging),
`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_MAILTO`, `SWITCH_OFF_NOTIFICATIONS`.

There are **no automated tests** and no test runner configured. Verification is `pnpm build` + `pnpm lint` + exercising endpoints against a dev MongoDB.

## Architecture

Koa 2 + koa-router + Mongoose 8 REST API for a fantasy basketball manager ("Fantabasket"), consumed by a separate SPA client (JWT + web-push). Deployed via `Procfile` (`node dist/index.js`).

Three layers only — there is no service layer:

- `src/routers/*.ts` — one router per domain, each `export default`s a `Router` that `src/index.ts` mounts flat (no prefixes; full paths are written in each route).
- `src/schemas/*.ts` — Mongoose models **plus the business logic**, as instance methods and statics (`league.populateLeague()`, `league.progress()`, `Lineup.getLineupByFantasyTeamAndFixture()`). Routers stay thin; put domain behaviour on the schema.
- `src/util/*.ts` — middleware and cross-entity algorithms too big for a schema (`result-calculator.ts`, `new-season.util.ts`, `statistics.ts`, `boxscore.ts`).

### Multi-tenancy (the most important convention)

Every request targets one league, passed as an HTTP **request header named `league`**, not a URL segment.

The middleware chain must be composed in this order:

```ts
router.post('/things', auth(), parseToken(), tenant(), admin(), handler)
```

- `auth()` — koa-jwt verification with `PUBLIC_KEY`
- `parseToken()` — reloads the user from Mongo into `ctx.state.user` (so schema methods like `isSuperAdmin()` are available) and puts the raw token in `ctx.state.token`
- `tenant()` — resolves the `league` header, rejects users not in `user.leagues` (SuperAdmin bypasses), then **`ctx.set('league', league.id)`**
- `admin()` / `superAdmin()` — role gates

Because `tenant()` stashes the league on the *response* header, handlers read it back with **`ctx.get('league')`** and every query must be scoped by it:

```ts
await Player.find({ league: ctx.get('league') }).exec();
```

Tenant-scoped documents extend `ITenant` (from `schemas/league.ts`), which adds the `league` ref. Omitting the `league` filter leaks data across leagues.

Unauthenticated routes are only `POST /users/login` and `PATCH /real-fixtures/fix-documents` (a data-repair endpoint).

### Domain model

Two parallel worlds joined by `Roster`:

- **Real** — `Team`, `Player`, `RealFixture` (a real matchday, ordered, with a `prepared` flag), `Roster` (player↔team for one `RealFixture`), `Performance` (a player's stats in one `RealFixture`).
- **Fantasy** — `FantasyTeam` (owned by `User`s), `FantasyRoster` (a `Roster` acquired by a fantasy team: contract, draft, `status` EXT/COM/STR/ITA), `Lineup` (fantasy roster entries for one `Fixture`), `Match` (home vs away fantasy team), `Fixture` (fantasy matchday), `Round`, `Competition` ("Campionato" / "Coppa").

`League` is the aggregate root: it embeds the season formats (`schemas/formats/*.ts`: regular season, playoff, playout, cup), the tunable `parameters` (`MAX_CONTRACTS`, `RESULT_DIVISOR`, `TREND`, …) and the `roles` spot table. `POST /leagues/:id/populate` calls `league.populateLeague()`, which wipes and rebuilds the entire season structure through `util/new-season.util.ts`.

### Season lifecycle

League phase is **derived, never stored**: `isPreseason()` (no prepared `RealFixture`), `isPostseason()` ("Stagione Regolare" round completed), `isOffseason()` (no incomplete `Fixture`).

The engine runs off one endpoint — `POST /matches/:id/round/:roundId/fixture/:fixtureId/compute`:

1. `util/result-calculator.ts` `computeResult()` turns lineups + performances into a fantasy score (grades, ranking, OER, plus/minus, overtime handling and its tie-breakers).
2. When all matches of a fixture are done, `fixture.completed = true` and `league.progress(realFixture)` runs: it closes finished rounds and competitions, then **clones every `Roster` and `FantasyRoster` into the next `RealFixture`** and marks it `prepared`. History is kept by duplication per matchday, which is why those documents are always queried with a `realFixture` filter.
3. `util/push-notification.ts` sends web-push notifications. Routers gate every `notify*` call behind `process.env.SWITCH_OFF_NOTIFICATIONS === 'true'` themselves — follow that pattern rather than adding the check inside the util.

`progress()` is guarded by the persisted `league.preparingNextRealFixture` flag — a DB-level re-entry lock; keep it intact.

### External data & uploads

- `util/boxscore.ts` scrapes real player stats from the public legabasket.it API (`POST /performances/team/:teamId/real-fixture/:realFixtureId` with a game `url`); it matches players by uppercased name, so name mismatches silently skip stats.
- `util/parse.ts` (csv-parse) + `@koa/multer` memory storage back the CSV uploads for players (`POST /players/upload`) and users; `util/player-upload-validation.ts` validates rows.
- Paginated endpoints (rosters, statistics) use `mongoose-paginate-v2` / `mongoose-aggregate-paginate-v2` and return the count in the `X-Total-Count` header, which is CORS-exposed in `src/index.ts`.

## Conventions

- **User-facing strings, comments and errors are in Italian** (`Utente non autorizzato…`, `entityNotFound()` → `Lega inesistente per la chiave di ricerca '…'`). Keep new messages Italian.
- Throw through Koa: `ctx.throw(entityNotFound('Match', ctx.params.id, ctx.get('league')), 404)`. The top-level middleware in `index.ts` maps thrown errors to status + message, falling back to `erroreImprevisto`.
- Reuse `util/functions.ts` helpers: `getLeague()` (throws if missing), `entityNotFound()`, `halfDownRound()` (the domain's round-half-down rule). `util/globals.ts` holds `AppConfig` (lineup sizes, default grade) and the `Role` enum.
- Schema files follow a fixed shape: `I<X>Document` (fields) → `I<X>` (adds instance methods) → `I<X>Model` (adds statics) → `new Schema<I<X>>` with `timestamps: true` and virtuals enabled in `toObject`/`toJSON` → `model<I<X>, I<X>Model>()`.
- **Code style: files are Prettier-formatted with double quotes**, while `tslint.json` still asks for single quotes — so `pnpm lint` emits hundreds of pre-existing `quotemark` warnings (severity `warning`, exit code 0). Match the surrounding double-quoted style; don't "fix" quotes wholesale. Real signal from lint is anything that is not `quotemark`.
- Max line length 180; 2-space indent (`.editorconfig`).
