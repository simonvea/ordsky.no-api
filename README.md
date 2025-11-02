# ordsky-apiv3

This is the backend for ordsky.no

Previously run serverless on AWS and then Cloudflare, it now runs as a simple node application.

It uses SQLite as database.

### Environment Variables

- `PORT` - Server port (default: 3000)
- `DB_URL` - SQLite database path (default: in-memory)
- `ALLOWED_ORIGIN` - CORS origin (default: \*)
- `CORS_POLICY` - Cross-origin resource policy: 'same-site', 'same-origin', or 'cross-origin' (default: cross-origin)
- `NODE_ENV` - Set to 'production' to enable helmet security and disable morgan logging
