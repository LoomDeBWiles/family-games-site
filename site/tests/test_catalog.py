import json
import re
import subprocess
from pathlib import Path

ROOT = Path(subprocess.run(["git", "rev-parse", "--show-toplevel"], cwd=Path(__file__).resolve().parent, capture_output=True, text=True, check=True).stdout.strip())
FIELDS = ("slug", "title", "icon", "desc", "tag", "theme")


def _games():
    return json.loads((ROOT / "games.json").read_text())["games"]


def _tracked():
    out = subprocess.run(["git", "ls-files"], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    return set(out.split())


def test_every_entry_has_the_fields_landing_js_renders():
    games = _games()
    assert games
    for game in games:
        for field in FIELDS:
            assert isinstance(game.get(field), str) and game[field], (game, field)


def test_slugs_are_unique():
    slugs = [game["slug"] for game in _games()]
    assert len(slugs) == len(set(slugs))


def test_every_slug_links_a_tracked_game_entry_page():
    tracked = _tracked()
    for game in _games():
        assert f"games/{game['slug']}/index.html" in tracked, game["slug"]


def test_landing_page_loads_its_script_and_style():
    html = (ROOT / "index.html").read_text()
    assert re.search(r"src=[\"']site/landing\.js[\"']", html)
    assert re.search(r"href=[\"']site/landing\.css[\"']", html)
    js = (ROOT / "site/landing.js").read_text()
    assert re.search(r"fetch\([\"'](?:\./)?games\.json[\"']\)", js)
    assert "games/${game.slug}/" in js
