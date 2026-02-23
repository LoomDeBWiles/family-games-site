using System.Collections.Generic;
using UnityEngine;

namespace BlockCraft
{
    public class WorldManager : MonoBehaviour
    {
        public static WorldManager Instance { get; private set; }

        [SerializeField] private Transform chunkParent;
        [SerializeField] private int seed = 0;

        private WorldGenerator _generator;
        private Dictionary<Vector2Int, Chunk> _loadedChunks = new Dictionary<Vector2Int, Chunk>();
        private HashSet<Vector2Int> _generatedChunkCoords = new HashSet<Vector2Int>();
        private Vector2Int _lastPlayerChunk;
        private bool _treesGenerated;
        private Grid _grid;

        public WorldGenerator Generator => _generator;
        public int Seed => seed;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        public void InitializeWorld(int worldSeed)
        {
            seed = worldSeed;
            _generator = new WorldGenerator(seed);

            // Create grid parent for all chunks
            if (chunkParent == null)
            {
                var gridGO = new GameObject("WorldGrid");
                _grid = gridGO.AddComponent<Grid>();
                _grid.cellSize = Vector3.one;
                chunkParent = gridGO.transform;
            }
            else
            {
                _grid = chunkParent.GetComponent<Grid>();
                if (_grid == null)
                    _grid = chunkParent.gameObject.AddComponent<Grid>();
            }
        }

        public void GenerateInitialChunks(Vector2 playerPos)
        {
            Vector2Int playerChunk = TileHelper.WorldToChunkCoord(
                Mathf.FloorToInt(playerPos.x),
                Mathf.FloorToInt(playerPos.y)
            );

            _lastPlayerChunk = playerChunk;

            // Generate chunks around spawn
            for (int cx = playerChunk.x - Constants.ViewDistanceInChunks; cx <= playerChunk.x + Constants.ViewDistanceInChunks; cx++)
            {
                for (int cy = playerChunk.y - Constants.ViewDistanceInChunks; cy <= playerChunk.y + Constants.ViewDistanceInChunks; cy++)
                {
                    LoadChunk(new Vector2Int(cx, cy));
                }
            }

            // Generate trees after initial terrain
            if (!_treesGenerated)
            {
                _generator.GenerateTrees(this);
                _treesGenerated = true;

                // Refresh visuals after tree placement
                foreach (var chunk in _loadedChunks.Values)
                {
                    chunk.RefreshVisuals();
                }
            }
        }

        public void UpdateChunks(Vector2 playerPos)
        {
            Vector2Int playerChunk = TileHelper.WorldToChunkCoord(
                Mathf.FloorToInt(playerPos.x),
                Mathf.FloorToInt(playerPos.y)
            );

            if (playerChunk == _lastPlayerChunk) return;
            _lastPlayerChunk = playerChunk;

            // Determine which chunks should be loaded
            HashSet<Vector2Int> needed = new HashSet<Vector2Int>();
            for (int cx = playerChunk.x - Constants.ViewDistanceInChunks; cx <= playerChunk.x + Constants.ViewDistanceInChunks; cx++)
            {
                for (int cy = playerChunk.y - Constants.ViewDistanceInChunks; cy <= playerChunk.y + Constants.ViewDistanceInChunks; cy++)
                {
                    needed.Add(new Vector2Int(cx, cy));
                }
            }

            // Unload distant chunks
            List<Vector2Int> toUnload = new List<Vector2Int>();
            foreach (var coord in _loadedChunks.Keys)
            {
                if (!needed.Contains(coord))
                    toUnload.Add(coord);
            }
            foreach (var coord in toUnload)
            {
                UnloadChunk(coord);
            }

            // Load new chunks
            foreach (var coord in needed)
            {
                if (!_loadedChunks.ContainsKey(coord))
                {
                    LoadChunk(coord);
                }
            }
        }

        private void LoadChunk(Vector2Int coord)
        {
            if (_loadedChunks.ContainsKey(coord)) return;

            // Validate chunk is within world bounds
            if (coord.x < 0 || coord.x >= Constants.WorldWidthInChunks ||
                coord.y < 0 || coord.y >= Constants.WorldHeightInChunks)
                return;

            GameObject chunkGO = new GameObject();
            chunkGO.transform.SetParent(chunkParent);
            chunkGO.layer = LayerMask.NameToLayer("Default");

            Chunk chunk = chunkGO.AddComponent<Chunk>();
            chunk.Initialize(coord);

            // Generate or load terrain data
            if (!_generatedChunkCoords.Contains(coord))
            {
                _generator.GenerateChunk(chunk);
                _generatedChunkCoords.Add(coord);
            }

            chunk.RefreshVisuals();
            _loadedChunks[coord] = chunk;
        }

        private void UnloadChunk(Vector2Int coord)
        {
            if (!_loadedChunks.TryGetValue(coord, out Chunk chunk)) return;

            // TODO: Save chunk data before unloading for persistence
            _loadedChunks.Remove(coord);
            Destroy(chunk.gameObject);
        }

        // === Tile Access API ===

        public TileID GetTile(int worldX, int worldY)
        {
            if (!TileHelper.IsInWorldBounds(worldX, worldY))
                return TileID.Air;

            Vector2Int chunkCoord = TileHelper.WorldToChunkCoord(worldX, worldY);
            Vector2Int local = TileHelper.WorldToLocalTile(worldX, worldY);

            if (_loadedChunks.TryGetValue(chunkCoord, out Chunk chunk))
            {
                return chunk.GetTile(local.x, local.y);
            }

            return TileID.Air;
        }

        public void SetTile(int worldX, int worldY, TileID id)
        {
            if (!TileHelper.IsInWorldBounds(worldX, worldY))
                return;

            Vector2Int chunkCoord = TileHelper.WorldToChunkCoord(worldX, worldY);
            Vector2Int local = TileHelper.WorldToLocalTile(worldX, worldY);

            if (_loadedChunks.TryGetValue(chunkCoord, out Chunk chunk))
            {
                chunk.SetTileImmediate(local.x, local.y, id);
            }
        }

        public bool IsSolid(int worldX, int worldY)
        {
            TileID id = GetTile(worldX, worldY);
            return TileRegistry.Instance != null && TileRegistry.Instance.IsSolid(id);
        }

        public Chunk GetChunk(Vector2Int coord)
        {
            _loadedChunks.TryGetValue(coord, out Chunk chunk);
            return chunk;
        }

        public Vector2 GetSpawnPosition()
        {
            int spawnX = Constants.WorldWidth / 2;
            int surfaceY = _generator.GetSurfaceHeight(spawnX);
            return new Vector2(spawnX + 0.5f, surfaceY + 2f);
        }

        public Dictionary<Vector2Int, Chunk> GetLoadedChunks() => _loadedChunks;
    }
}
