using UnityEngine;
using UnityEngine.Tilemaps;

namespace BlockCraft
{
    public class Chunk : MonoBehaviour
    {
        public Vector2Int ChunkCoord { get; private set; }
        public TileID[,] Tiles { get; private set; }

        private Tilemap _tilemap;
        private TilemapRenderer _tilemapRenderer;
        private TilemapCollider2D _tilemapCollider;
        private CompositeCollider2D _compositeCollider;
        private Rigidbody2D _rigidbody;
        private bool _isDirty;

        public void Initialize(Vector2Int coord)
        {
            ChunkCoord = coord;
            Tiles = new TileID[Constants.ChunkWidth, Constants.ChunkHeight];

            gameObject.name = $"Chunk_{coord.x}_{coord.y}";

            // Setup tilemap components
            var grid = GetComponentInParent<Grid>();
            if (grid == null)
            {
                var gridGO = new GameObject("Grid");
                grid = gridGO.AddComponent<Grid>();
                grid.cellSize = Vector3.one;
                transform.SetParent(grid.transform);
            }

            _tilemap = gameObject.AddComponent<Tilemap>();
            _tilemapRenderer = gameObject.AddComponent<TilemapRenderer>();
            _tilemapRenderer.sortingOrder = 0;

            _tilemapCollider = gameObject.AddComponent<TilemapCollider2D>();
            _tilemapCollider.usedByComposite = true;

            _rigidbody = gameObject.AddComponent<Rigidbody2D>();
            _rigidbody.bodyType = RigidbodyType2D.Static;

            _compositeCollider = gameObject.AddComponent<CompositeCollider2D>();
            _compositeCollider.geometryType = CompositeCollider2D.GeometryType.Polygons;

            // Position the chunk in world space
            Vector2Int origin = TileHelper.ChunkToWorldOrigin(coord.x, coord.y);
            transform.position = new Vector3(origin.x, origin.y, 0);
        }

        public TileID GetTile(int localX, int localY)
        {
            if (localX < 0 || localX >= Constants.ChunkWidth || localY < 0 || localY >= Constants.ChunkHeight)
                return TileID.Air;
            return Tiles[localX, localY];
        }

        public void SetTile(int localX, int localY, TileID id)
        {
            if (localX < 0 || localX >= Constants.ChunkWidth || localY < 0 || localY >= Constants.ChunkHeight)
                return;
            Tiles[localX, localY] = id;
            _isDirty = true;
        }

        public void SetTileImmediate(int localX, int localY, TileID id)
        {
            SetTile(localX, localY, id);
            UpdateSingleTile(localX, localY);
        }

        public void RefreshVisuals()
        {
            if (_tilemap == null) return;

            var registry = TileRegistry.Instance;
            if (registry == null) return;

            for (int x = 0; x < Constants.ChunkWidth; x++)
            {
                for (int y = 0; y < Constants.ChunkHeight; y++)
                {
                    UpdateSingleTile(x, y);
                }
            }
            _isDirty = false;
        }

        private void UpdateSingleTile(int localX, int localY)
        {
            var registry = TileRegistry.Instance;
            if (registry == null) return;

            TileID id = Tiles[localX, localY];
            Vector3Int tilePos = new Vector3Int(localX, localY, 0);

            if (id == TileID.Air)
            {
                _tilemap.SetTile(tilePos, null);
            }
            else
            {
                BlockData blockData = registry.GetBlockData(id);
                if (blockData != null && blockData.tileAsset != null)
                {
                    _tilemap.SetTile(tilePos, blockData.tileAsset);
                }
                else if (blockData != null && blockData.sprite != null)
                {
                    // Fallback: create a simple tile from sprite
                    var tile = ScriptableObject.CreateInstance<Tile>();
                    tile.sprite = blockData.sprite;
                    tile.color = Color.white;
                    tile.colliderType = blockData.isSolid ? Tile.ColliderType.Grid : Tile.ColliderType.None;
                    _tilemap.SetTile(tilePos, tile);
                }
                else
                {
                    _tilemap.SetTile(tilePos, null);
                }
            }
        }

        public bool IsDirty => _isDirty;

        public void MarkDirty() => _isDirty = true;
    }
}
