# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start    # start dev server with nodemon (auto-restarts on changes)
npm run dev  # alias for start
npm run seed # seed MongoDB with 10 users and 25 notes (password for all seeded users: "password")
npm run lint # run ESLint
```

No test runner is configured.

## Environment setup

The app requires a `.env` file at the project root (gitignored). Required variables:

```
DB_HOST=mongodb://localhost:27017/notedly
JWT_SECRET=<any string>
PORT=4000  # optional, defaults to 4000
```

MongoDB must be running locally. On macOS with Homebrew: `brew services start mongodb-community@4.4`.

**Node.js v22+ compatibility:** `node_modules/buffer-equal-constant-time/index.js` line 4 must read `var SlowBuffer = require('buffer').SlowBuffer || Buffer;` — `SlowBuffer` was removed from Node.js v22 and the pinned `jwa` dependency (used by `jsonwebtoken`) references it directly. This patch is lost on every `npm install` and must be reapplied.

## Architecture

This is a GraphQL API built with Apollo Server + Express, backed by MongoDB via Mongoose.

**Entry point:** `src/index.js` — sets up Express 5 + Apollo Server 5 (via `@as-integrations/express5`), reads the JWT from `Authorization` header (bare token or `Bearer <token>`), decodes it with `jsonwebtoken`, and injects the resulting `user` object into the Apollo context alongside the Mongoose `models`. Apollo Server must be `await server.start()`-ed before mounting the Express middleware.

**GraphQL layer:**
- `src/schema.js` — single SDL file using `graphql-tag` defining all types (`Note`, `User`, `NoteFeed`) and all Query/Mutation signatures
- `src/resolvers/` — split by concern: `query.js`, `mutation.js`, `note.js` (field resolvers for Note), `user.js` (field resolvers for User). Assembled in `resolvers/index.js` along with the `DateTime` scalar from `graphql-scalars`.
- Auth errors use `GraphQLError` from `graphql` with `extensions: { code: 'UNAUTHENTICATED' | 'FORBIDDEN' }` — there is no `AuthenticationError`/`ForbiddenError` helper since Apollo Server 4+.

**Data layer:**
- `src/db.js` — singleton Mongoose connection helper; called once at startup with the `DB_HOST` env var
- `src/models/note.js` — Note schema (content, author ref, favoriteCount, favoritedBy array)
- `src/models/user.js` — User schema (username, email, password hash, avatar URL)
- `src/models/index.js` — re-exports both models as `{ Note, User }`

**Auth flow:** `signUp`/`signIn` mutations return a JWT signed with `JWT_SECRET`. Clients send it as the `Authorization` header (bare token, not Bearer-prefixed). The server verifies it on every request and makes `user.id` available in resolver context. All write mutations (`newNote`, `updateNote`, `deleteNote`, `toggleFavorite`) throw `AuthenticationError` when `user` is absent and `ForbiddenError` when the requesting user doesn't own the resource.

**Utilities:**
- `src/util/gravatar.js` — derives a Gravatar URL from an MD5-hashed email; called during `signUp`
- `src/util/seed/` — uses `faker` to generate test users and notes; run via `npm run seed`

**Pagination:** `noteFeed` query implements cursor-based pagination using MongoDB ObjectIDs as cursors (sorted descending, queried with `$lt`), page size hardcoded to 10.
