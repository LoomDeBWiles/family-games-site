<!-- Scope: Traps learned while building this site. -->

- `games/mini-warriors/`: copied from `dist/` only — source lives in `harvey_games/mini-warriors/`, don't edit here
- `games/blockcraft/`: contains Unity C# source + sprites alongside `index.html` — the game runs from the single HTML file, ignore the Assets/Packages/ProjectSettings dirs
- Landing page is data-driven — `index.html` fetches `games.json` at runtime, so cards won't render without a local server (no `file://`)
- Game slugs in `games.json` must match directory names under `games/` exactly
- Renamed dirs from source: `ninja/` → `shadow-strike/`, `galixy-defence/` → `galaxy-defense/`
