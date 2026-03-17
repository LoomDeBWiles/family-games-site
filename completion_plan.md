# Completion Plan — Family Games Site

## Current State
- Repo: https://github.com/LoomDeBWiles/family-games-site (public)
- 7 games copied, landing page working, context tree set up
- **Hosting:** Cloudflare Pages, auto-deploys from `main` branch
- **URL:** https://hbwgames.pages.dev

---

## Step 1: Verify deploy

1. Visit `https://hbwgames.pages.dev` — landing page should show 7 game cards
2. Click each game, confirm it loads:
   - Shadow Strike (ninja action)
   - Galaxy Defense (space shooter)
   - Last Person on Earth (survival)
   - Power Towers (tower defense)
   - Mini Warriors (Phaser game — most likely to break, check console)
   - School Escape (3D stealth)
   - BlockCraft (2D survival)
3. Check HTTPS padlock is showing (Cloudflare handles SSL automatically)

## Step 2: Analytics (optional)

Cloudflare Web Analytics — free, unlimited, privacy-friendly, already in your dashboard.

1. Go to https://dash.cloudflare.com → **Web Analytics** in the left sidebar
2. Click **Add a site**, enter `hbwgames.pages.dev`
3. Copy the script tag it gives you, e.g.:
   ```html
   <script defer src="https://static.cloudflareinsights.com/beacon.min.js"
     data-cf-beacon='{"token": "YOUR-TOKEN"}'></script>
   ```
4. Add it to `index.html` (replace the `<!-- Analytics -->` comment)
5. Also add it to each game's `index.html` if you want per-game tracking
6. Commit, push — Cloudflare auto-deploys

## Update workflow

Just push to `main` — Cloudflare Pages auto-deploys within ~30 seconds.

```bash
cd ~/projects/family-games-site
git add ...
git commit -m "..."
git push
```

## Adding a new game later
1. Drop game folder into `games/`
2. Add entry to `games.json` (slug, title, icon, desc, tag, theme)
3. Add a CSS theme class in `landing.css` if you want a custom card color
4. Commit, push — auto-deploys

---

## Quick reference

| What | Where |
|------|-------|
| Repo | `~/projects/family-games-site` |
| Live site | `https://hbwgames.pages.dev` |
| Dashboard | https://dash.cloudflare.com → Workers & Pages |
| Analytics | https://dash.cloudflare.com → Web Analytics |
| Landing page | `index.html` + `landing.css` + `games.json` |
| Games | `games/{slug}/index.html` |
