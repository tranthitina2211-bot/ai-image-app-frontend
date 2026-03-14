# Angular patch notes

This frontend patch now:
- uses Laravel Sanctum bearer tokens
- prefixes `/api/*` requests to `http://127.0.0.1:8000`
- loads media, collections, and settings from backend
- uses polling every 2 seconds for generation job status

## Default local login
- register a new account, or
- use the seeded account if your backend seeder still uses one

## Backend URL
Edit `src/environments/environment.ts` if your Laravel server is not on port 8000.
