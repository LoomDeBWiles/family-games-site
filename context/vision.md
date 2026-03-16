<!-- Scope: What this project is and isn't. -->

# Vision

Public-facing static site hosting family arcade games. All games are purely client-side HTML/JS with zero backend dependencies.

## Goals
- Simple deploy: push to GitHub, serve via nginx/Caddy on Hetzner
- Easy to add games: drop folder in `games/`, add entry to `games.json`
- Clean public URLs: `/games/{slug}/`

## Non-Goals
- No backend, no database, no auth
- No build step — all games are pre-built static files
- No per-person grouping — games are public, not organized by kid
