fetch('games.json')
  .then(r => r.json())
  .then(data => {
    const grid = document.getElementById('games-grid');
    data.games.forEach(game => {
      const card = document.createElement('a');
      card.href = `games/${game.slug}/`;
      card.className = `game-card card-${game.theme}`;
      card.innerHTML = `
        <div class="card-banner">${game.icon}</div>
        <div class="card-body">
          <h2>${game.title}</h2>
          <p>${game.desc}</p>
          <span class="card-tag">${game.tag}</span>
        </div>`;
      grid.appendChild(card);
    });
  });
const starsEl = document.getElementById('stars');
for (let i = 0; i < 120; i++) {
  const star = document.createElement('div');
  star.className = 'star';
  const size = Math.random() * 3 + 1;
  star.style.width = size + 'px';
  star.style.height = size + 'px';
  star.style.left = Math.random() * 100 + '%';
  star.style.top = Math.random() * 100 + '%';
  star.style.setProperty('--dur', (2 + Math.random() * 4) + 's');
  star.style.animationDelay = Math.random() * 4 + 's';
  starsEl.appendChild(star);
}
