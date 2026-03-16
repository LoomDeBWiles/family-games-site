# Completion Plan — Family Games Site

## Current State
- Repo: https://github.com/LoomDeBWiles/family-games-site (public)
- 7 games copied, landing page working, context tree set up
- **Not yet:** domain, DNS, server config, analytics, SSL

---

## Step 1: Clone repo on Hetzner

```bash
cd ~/projects
git clone git@github.com:LoomDeBWiles/family-games-site.git
```

## Step 2: Choose and buy a domain

Pick a domain (e.g. `familyarcade.xyz`, `playwiles.com`, whatever). Purchase from any registrar (Cloudflare, Namecheap, Porkbun, etc.).

## Step 3: DNS setup

Point the domain to the Hetzner server IP. At your registrar, create:

| Type | Name | Value |
|------|------|-------|
| A | `@` | `<hetzner-server-ip>` |
| A | `www` | `<hetzner-server-ip>` |

Wait for propagation (~5 min with Cloudflare, up to 24h elsewhere).

Verify: `dig +short yourdomain.com`

## Step 4: Deploy files to /srv

Following the existing pattern (files in `/srv/site/`, owned by root):

```bash
# Create a dedicated directory for the game site
sudo mkdir -p /srv/games-site
sudo cp -r ~/projects/family-games-site/index.html /srv/games-site/
sudo cp -r ~/projects/family-games-site/landing.css /srv/games-site/
sudo cp -r ~/projects/family-games-site/games.json /srv/games-site/
sudo cp -r ~/projects/family-games-site/games/ /srv/games-site/games/
sudo chown -R root:root /srv/games-site
```

Or symlink if you prefer easier updates:
```bash
# Alternative: symlink so git pull auto-updates
sudo ln -s /home/ben/projects/family-games-site /srv/games-site
```

## Step 5: Caddy config

Add a site block to the Caddyfile. The existing server uses Caddy (see `frontend/Caddyfile` pattern from fieldmarshl.com).

```bash
sudo nano /etc/caddy/Caddyfile
```

Add:
```caddyfile
yourdomain.com {
    root * /srv/games-site
    file_server
    encode gzip

    # Pretty URLs: try /games/slug/ then /games/slug/index.html
    try_files {path} {path}/ {path}/index.html

    # Cache static assets aggressively
    @static path *.css *.js *.png *.jpg *.wav *.mp3 *.json
    header @static Cache-Control "public, max-age=604800"

    # Security headers
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options SAMEORIGIN
        Referrer-Policy strict-origin-when-cross-origin
    }
}
```

Reload:
```bash
sudo systemctl reload caddy
```

Caddy handles SSL automatically via Let's Encrypt — no manual cert setup needed.

## Step 6: Verify

1. Visit `https://yourdomain.com` — landing page should show 7 game cards
2. Click each game, confirm it loads:
   - Shadow Strike (ninja action)
   - Galaxy Defense (space shooter)
   - Last Person on Earth (survival)
   - Power Towers (tower defense)
   - Mini Warriors (Phaser game — most likely to break, check console)
   - School Escape (3D stealth)
   - BlockCraft (2D survival)
3. Check HTTPS padlock is showing (Caddy auto-provisions Let's Encrypt cert)

## Step 7: Analytics (optional, do whenever)

### Option A: Umami (self-hosted, privacy-friendly)
```bash
# If you want to self-host on the same server
docker run -d --name umami -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  ghcr.io/umami-software/umami:postgresql-latest
```
Then add to the Caddyfile a reverse proxy for the analytics dashboard.

### Option B: Umami Cloud (easiest)
Sign up at https://cloud.umami.is (free tier: 10k events/month).
Get the tracking script and add it to `index.html`:
```html
<script async src="https://cloud.umami.is/script.js" data-website-id="YOUR-ID"></script>
```

### Option C: Plausible Cloud
Sign up at https://plausible.io ($9/mo). Same idea — drop script tag into `index.html`.

After choosing, replace the `<!-- Analytics -->` comment in `index.html`, commit, and redeploy.

## Step 8: Update workflow

After any changes:
```bash
cd ~/projects/family-games-site
git pull

# If using /srv copy (not symlink):
sudo cp -r index.html landing.css games.json games/ /srv/games-site/
```

## Adding a new game later
1. Drop game folder into `games/`
2. Add entry to `games.json` (slug, title, icon, desc, tag, theme)
3. Add a CSS theme class in `landing.css` if you want a custom card color
4. Commit, push, pull on server, redeploy

---

## Quick reference

| What | Where |
|------|-------|
| Repo | `~/projects/family-games-site` |
| Serve dir | `/srv/games-site` |
| Caddy config | `/etc/caddy/Caddyfile` |
| Reload Caddy | `sudo systemctl reload caddy` |
| Landing page | `index.html` + `landing.css` + `games.json` |
| Games | `games/{slug}/index.html` |
