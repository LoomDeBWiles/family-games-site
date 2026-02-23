using System.Collections.Generic;
using UnityEngine;

namespace BlockCraft
{
    /// <summary>
    /// Extension for WorldManager that handles chunk data persistence
    /// when chunks are unloaded (stores modified tile data in memory).
    /// </summary>
    public class ChunkDataCache
    {
        private Dictionary<Vector2Int, TileID[,]> _cachedChunks = new Dictionary<Vector2Int, TileID[,]>();

        public void CacheChunk(Vector2Int coord, TileID[,] tiles)
        {
            // Deep copy the tile array
            var copy = new TileID[Constants.ChunkWidth, Constants.ChunkHeight];
            for (int x = 0; x < Constants.ChunkWidth; x++)
                for (int y = 0; y < Constants.ChunkHeight; y++)
                    copy[x, y] = tiles[x, y];

            _cachedChunks[coord] = copy;
        }

        public bool TryGetCachedChunk(Vector2Int coord, out TileID[,] tiles)
        {
            return _cachedChunks.TryGetValue(coord, out tiles);
        }

        public bool HasCachedChunk(Vector2Int coord)
        {
            return _cachedChunks.ContainsKey(coord);
        }

        public void Clear()
        {
            _cachedChunks.Clear();
        }

        public Dictionary<Vector2Int, TileID[,]> GetAllCached() => _cachedChunks;

        public int Count => _cachedChunks.Count;
    }
}
