using UnityEngine;

namespace BlockCraft
{
    public class WorldGenerator
    {
        private int _seed;
        private float _terrainOffset;
        private float _caveOffsetX;
        private float _caveOffsetY;
        private float _oreOffsetX;
        private float _oreOffsetY;

        public WorldGenerator(int seed)
        {
            _seed = seed;
            var rng = new System.Random(seed);
            _terrainOffset = (float)(rng.NextDouble() * 10000);
            _caveOffsetX = (float)(rng.NextDouble() * 10000);
            _caveOffsetY = (float)(rng.NextDouble() * 10000);
            _oreOffsetX = (float)(rng.NextDouble() * 10000);
            _oreOffsetY = (float)(rng.NextDouble() * 10000);
        }

        public int Seed => _seed;

        public void GenerateChunk(Chunk chunk)
        {
            Vector2Int origin = TileHelper.ChunkToWorldOrigin(chunk.ChunkCoord.x, chunk.ChunkCoord.y);

            for (int lx = 0; lx < Constants.ChunkWidth; lx++)
            {
                int worldX = origin.x + lx;
                if (worldX < 0 || worldX >= Constants.WorldWidth) continue;

                int surfaceY = GetSurfaceHeight(worldX);

                for (int ly = 0; ly < Constants.ChunkHeight; ly++)
                {
                    int worldY = origin.y + ly;
                    if (worldY < 0 || worldY >= Constants.WorldHeight) continue;

                    TileID tile = DetermineTile(worldX, worldY, surfaceY);
                    chunk.Tiles[lx, ly] = tile;
                }
            }
        }

        public int GetSurfaceHeight(int worldX)
        {
            // Multi-octave Perlin noise for terrain height
            float noise1 = Mathf.PerlinNoise((worldX + _terrainOffset) * Constants.TerrainScale, _terrainOffset);
            float noise2 = Mathf.PerlinNoise((worldX + _terrainOffset) * Constants.TerrainScale * 0.5f, _terrainOffset + 100f) * 0.5f;
            float noise3 = Mathf.PerlinNoise((worldX + _terrainOffset) * Constants.TerrainScale * 2f, _terrainOffset + 200f) * 0.25f;

            float combined = (noise1 + noise2 + noise3) / 1.75f;
            return Constants.SurfaceHeight + Mathf.RoundToInt(combined * 30f - 15f);
        }

        private TileID DetermineTile(int worldX, int worldY, int surfaceY)
        {
            // Above surface = air
            if (worldY > surfaceY)
                return TileID.Air;

            // Bedrock layer
            if (worldY <= Constants.BedrockLayer)
                return TileID.Bedrock;

            // Surface = grass
            if (worldY == surfaceY)
                return TileID.Grass;

            // Dirt layer (just below surface)
            int depthBelowSurface = surfaceY - worldY;
            if (depthBelowSurface <= Constants.DirtLayerDepth)
            {
                // Check for caves in dirt too
                if (IsCave(worldX, worldY))
                    return TileID.Air;
                return TileID.Dirt;
            }

            // Stone layer - check caves first
            if (IsCave(worldX, worldY))
                return TileID.Air;

            // Check for ores
            TileID ore = GetOre(worldX, worldY, depthBelowSurface);
            if (ore != TileID.Air)
                return ore;

            return TileID.Stone;
        }

        private bool IsCave(int worldX, int worldY)
        {
            float noise = Mathf.PerlinNoise(
                (worldX + _caveOffsetX) * Constants.CaveScale,
                (worldY + _caveOffsetY) * Constants.CaveScale
            );

            // Larger caves deeper underground
            float depthFactor = 1f - (float)worldY / Constants.WorldHeight;
            float threshold = Constants.CaveThreshold + depthFactor * 0.05f;

            return noise < threshold;
        }

        private TileID GetOre(int worldX, int worldY, int depth)
        {
            float noise = Mathf.PerlinNoise(
                (worldX + _oreOffsetX) * Constants.OreScale,
                (worldY + _oreOffsetY) * Constants.OreScale
            );

            // Diamond - deep only
            if (depth >= Constants.DiamondMinDepth && noise > Constants.DiamondThreshold)
                return TileID.DiamondOre;

            // Gold - medium-deep
            if (depth >= Constants.GoldMinDepth && noise > Constants.GoldThreshold)
                return TileID.GoldOre;

            // Iron - medium depth
            float ironNoise = Mathf.PerlinNoise(
                (worldX + _oreOffsetX + 500) * Constants.OreScale,
                (worldY + _oreOffsetY + 500) * Constants.OreScale
            );
            if (depth >= Constants.IronMinDepth && ironNoise > Constants.IronThreshold)
                return TileID.IronOre;

            // Coal - everywhere below surface
            float coalNoise = Mathf.PerlinNoise(
                (worldX + _oreOffsetX + 1000) * Constants.OreScale,
                (worldY + _oreOffsetY + 1000) * Constants.OreScale
            );
            if (coalNoise > Constants.CoalThreshold)
                return TileID.Coal;

            return TileID.Air;
        }

        public void GenerateTrees(WorldManager worldManager)
        {
            var rng = new System.Random(_seed + 42);

            for (int x = 2; x < Constants.WorldWidth - 2; x++)
            {
                if ((float)rng.NextDouble() > Constants.TreeChance) continue;

                int surfaceY = GetSurfaceHeight(x);

                // Only place trees on grass
                TileID surface = worldManager.GetTile(x, surfaceY);
                if (surface != TileID.Grass) continue;

                // Check flat ground (no tree if neighbors are very different height)
                int leftSurface = GetSurfaceHeight(x - 1);
                int rightSurface = GetSurfaceHeight(x + 1);
                if (Mathf.Abs(surfaceY - leftSurface) > 1 || Mathf.Abs(surfaceY - rightSurface) > 1)
                    continue;

                int treeHeight = rng.Next(Constants.TreeMinHeight, Constants.TreeMaxHeight + 1);
                PlaceTree(worldManager, x, surfaceY + 1, treeHeight);
            }
        }

        private void PlaceTree(WorldManager worldManager, int baseX, int baseY, int height)
        {
            // Trunk
            for (int y = 0; y < height; y++)
            {
                worldManager.SetTile(baseX, baseY + y, TileID.Wood);
            }

            // Leaves (canopy)
            int topY = baseY + height;
            for (int dy = -1; dy <= 2; dy++)
            {
                for (int dx = -2; dx <= 2; dx++)
                {
                    if (dx == 0 && dy < 0) continue; // Don't replace trunk top area
                    int lx = baseX + dx;
                    int ly = topY + dy;

                    // Skip corners for rounder look
                    if (Mathf.Abs(dx) == 2 && dy == 2) continue;

                    if (worldManager.GetTile(lx, ly) == TileID.Air)
                    {
                        worldManager.SetTile(lx, ly, TileID.Leaves);
                    }
                }
            }
        }
    }
}
