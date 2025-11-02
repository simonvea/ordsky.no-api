# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the backend API for ordsky.no, a collaborative word cloud application. The API supports both REST endpoints and WebSocket connections for real-time collaboration.

## Development Commands

```bash
# Start development server with auto-reload
npm run dev

# Type checking (no emit)
npm run check

# Build TypeScript
npm run build
```

## Running Tests

```bash
# Run all tests
npx vitest

# Run tests in watch mode
npx vitest --watch

# Run a specific test file
npx vitest test/start-session.test.ts
```

## Architecture

### Dual Feature System

The application has two parallel feature implementations:

1. **collectFeature** (`/api/felles/*`)
   - REST-only implementation
   - Uses `sessions` table
   - Synchronous operations
   - Located in `src/collectFeature/`

2. **collabFeature** (`/api/collaborative/*`)
   - Hybrid REST + WebSocket implementation
   - Uses `live_sessions` table
   - Real-time collaboration via Socket.IO
   - Located in `src/collabFeature/`

Both features share the same core functionality (word collection and cloud generation) but with different communication patterns.

### Application Entry Point

- `src/index.ts` - Creates HTTP server, initializes Socket.IO, runs migrations, starts server
- `src/app.ts` - Express app configuration, middleware setup, route registration

### WebSocket Architecture

The WebSocket layer uses Socket.IO (`/ws` path, websocket-only transport):

- Server setup in `src/index.ts:14-18`
- Connection handler in `src/index.ts:20-24`
- Event handlers registered in `src/collabFeature/socket.ts`
- TypeScript event types defined in `src/collabFeature/types.ts`

Key events:
- `startsession` - Creates a new collaborative session
- `joinsession` - Joins existing session, receives current state
- `savewords` - Adds words to session, broadcasts to all participants
- `savecloud` - Completes session with generated word cloud

### Database Layer

**SQLite with Node's built-in DatabaseSync** (node:sqlite):

- Single database instance: `src/db/database.ts`
- Migration system: `src/db/migrate.ts` (runs on startup)
- Migrations stored in `src/db/migrations/` (numbered SQL files)
- Uses `db.createTagStore()` for SQL tagged template literals

**Two separate tables:**
- `sessions` - For collectFeature (REST-only)
- `live_sessions` - For collabFeature (WebSocket + REST)

Both store JSON-serialized data in TEXT columns:
- `words` - Array of submitted words
- `cloud` - Generated word cloud data
- `word_count` - Word frequency data

**Database configuration:**
- Set `DB_URL` environment variable (defaults to `./ordsky.sql`)
- Falls back to `:memory:` if DB_URL not set

### Environment Variables

- `PORT` - Server port (default: 3000)
- `DB_URL` - SQLite database path (default: ./ordsky.sql)
- `ALLOWED_ORIGIN` - CORS origin (default: *)
- `CORS_POLICY` - Cross-origin resource policy: 'same-site', 'same-origin', or 'cross-origin' (default: cross-origin)
- `NODE_ENV` - Set to 'production' to enable helmet security and disable morgan logging

### TypeScript Configuration

The project uses modern TypeScript with ESM:
- Module system: `nodenext`
- Import extensions required (`.ts` in imports, rewritten at runtime)
- Type-only mode: `verbatimModuleSyntax: true`, `erasableSyntaxOnly: true`
- No emit: TypeScript used only for type checking, code runs directly via Node.js `--watch`
- Strict mode enabled with additional checks (noUnusedLocals, noUnusedParameters)

## Deployment

Uses AWS SAM for deployment:

```bash
sam build
sam deploy
```

For API Gateway changes:
```bash
aws apigatewayv2 create-deployment --api-id ${id} --stage-name Prod --description "deployed from cli"
```

## Adding Database Migrations

1. Create numbered SQL file in `src/db/migrations/` (e.g., `004_description.sql`)
2. Migrations run automatically on server start
3. Applied migrations tracked in `_migrations` table
