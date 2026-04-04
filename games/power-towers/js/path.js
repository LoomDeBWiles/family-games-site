// Path system for enemy movement

class Path {
    constructor() {
        this.waypoints = [];
        this.tileSize = 50;
        this.pathTilesCache = null;
    }

    generatePath(mapWidth, mapHeight) {
        this.waypoints = [];
        const tileW = Math.floor(mapWidth / this.tileSize);
        const tileH = Math.floor(mapHeight / this.tileSize);

        // Create a more interesting winding path
        let y = Math.floor(tileH / 2);

        // Start off-screen
        this.waypoints.push({ x: -50, y: y * this.tileSize + this.tileSize / 2 });

        // Entry point
        this.waypoints.push({ x: this.tileSize / 2, y: y * this.tileSize + this.tileSize / 2 });

        // Clean S-shaped snake path across the whole map
        const segments = [
            { dx: 13, dy: 0 },   // go right across top
            { dx: 0, dy: 4 },    // down
            { dx: -12, dy: 0 },  // go left
            { dx: 0, dy: 4 },    // down
            { dx: 13, dy: 0 },   // go right across bottom
        ];

        let currentX = 1;
        let currentY = y;

        for (const segment of segments) {
            currentX += segment.dx;
            currentY += segment.dy;
            currentX = Math.max(0, Math.min(tileW - 1, currentX));
            currentY = Math.max(0, Math.min(tileH - 1, currentY));

            this.waypoints.push({
                x: currentX * this.tileSize + this.tileSize / 2,
                y: currentY * this.tileSize + this.tileSize / 2
            });
        }

        // Exit off-screen
        this.waypoints.push({ x: mapWidth + 50, y: currentY * this.tileSize + this.tileSize / 2 });

        this.pathTilesCache = null;
        return this.waypoints;
    }

    getPathTiles() {
        if (this.pathTilesCache) return this.pathTilesCache;

        const tiles = [];
        const addedKeys = new Set();

        for (let i = 0; i < this.waypoints.length - 1; i++) {
            const start = this.waypoints[i];
            const end = this.waypoints[i + 1];

            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const steps = Math.max(Math.abs(dx), Math.abs(dy)) / (this.tileSize / 2);

            for (let s = 0; s <= steps; s++) {
                const x = start.x + (dx / steps) * s;
                const y = start.y + (dy / steps) * s;
                const tileX = Math.floor(x / this.tileSize);
                const tileY = Math.floor(y / this.tileSize);
                const key = `${tileX},${tileY}`;

                if (!addedKeys.has(key)) {
                    addedKeys.add(key);
                    tiles.push({ x: tileX, y: tileY });
                }
            }
        }

        this.pathTilesCache = tiles;
        return tiles;
    }

    isOnPath(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        return this.getPathTiles().some(t => t.x === tileX && t.y === tileY);
    }

    draw(ctx) {
        if (this.waypoints.length < 2) return;

        const tiles = this.getPathTiles();

        // Draw dirt path base
        tiles.forEach(tile => {
            const x = tile.x * this.tileSize;
            const y = tile.y * this.tileSize;

            // Main dirt color
            ctx.fillStyle = '#8B7355';
            ctx.fillRect(x, y, this.tileSize, this.tileSize);

            // Add texture variation
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            for (let i = 0; i < 5; i++) {
                const px = x + Math.random() * this.tileSize;
                const py = y + Math.random() * this.tileSize;
                ctx.beginPath();
                ctx.arc(px, py, 2 + Math.random() * 3, 0, Math.PI * 2);
                ctx.fill();
            }

            // Lighter spots
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            for (let i = 0; i < 3; i++) {
                const px = x + Math.random() * this.tileSize;
                const py = y + Math.random() * this.tileSize;
                ctx.beginPath();
                ctx.arc(px, py, 1 + Math.random() * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Draw path edges/borders
        ctx.strokeStyle = '#6B5344';
        ctx.lineWidth = 2;
        tiles.forEach(tile => {
            const x = tile.x * this.tileSize;
            const y = tile.y * this.tileSize;

            // Check adjacent tiles to draw borders
            const hasTop = tiles.some(t => t.x === tile.x && t.y === tile.y - 1);
            const hasBottom = tiles.some(t => t.x === tile.x && t.y === tile.y + 1);
            const hasLeft = tiles.some(t => t.x === tile.x - 1 && t.y === tile.y);
            const hasRight = tiles.some(t => t.x === tile.x + 1 && t.y === tile.y);

            if (!hasTop) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + this.tileSize, y);
                ctx.stroke();
            }
            if (!hasBottom) {
                ctx.beginPath();
                ctx.moveTo(x, y + this.tileSize);
                ctx.lineTo(x + this.tileSize, y + this.tileSize);
                ctx.stroke();
            }
            if (!hasLeft) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + this.tileSize);
                ctx.stroke();
            }
            if (!hasRight) {
                ctx.beginPath();
                ctx.moveTo(x + this.tileSize, y);
                ctx.lineTo(x + this.tileSize, y + this.tileSize);
                ctx.stroke();
            }
        });

        // Draw wagon wheel tracks
        ctx.strokeStyle = 'rgba(90, 70, 50, 0.4)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 15]);
        ctx.beginPath();
        ctx.moveTo(this.waypoints[0].x, this.waypoints[0].y - 8);
        for (let i = 1; i < this.waypoints.length; i++) {
            ctx.lineTo(this.waypoints[i].x, this.waypoints[i].y - 8);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.waypoints[0].x, this.waypoints[0].y + 8);
        for (let i = 1; i < this.waypoints.length; i++) {
            ctx.lineTo(this.waypoints[i].x, this.waypoints[i].y + 8);
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }

    getSpawnPoint() {
        return this.waypoints[0];
    }

    getEndPoint() {
        return this.waypoints[this.waypoints.length - 1];
    }
}
