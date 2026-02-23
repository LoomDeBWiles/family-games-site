using UnityEngine;

namespace BlockCraft
{
    public static class TileHelper
    {
        public static Vector2Int WorldToChunkCoord(int worldX, int worldY)
        {
            int cx = Mathf.FloorToInt((float)worldX / Constants.ChunkWidth);
            int cy = Mathf.FloorToInt((float)worldY / Constants.ChunkHeight);
            return new Vector2Int(cx, cy);
        }

        public static Vector2Int WorldToLocalTile(int worldX, int worldY)
        {
            int lx = ((worldX % Constants.ChunkWidth) + Constants.ChunkWidth) % Constants.ChunkWidth;
            int ly = ((worldY % Constants.ChunkHeight) + Constants.ChunkHeight) % Constants.ChunkHeight;
            return new Vector2Int(lx, ly);
        }

        public static Vector2Int ChunkToWorldOrigin(int chunkX, int chunkY)
        {
            return new Vector2Int(chunkX * Constants.ChunkWidth, chunkY * Constants.ChunkHeight);
        }

        public static Vector2Int MouseToTilePos(Camera cam)
        {
            Vector3 mouseWorld = cam.ScreenToWorldPoint(Input.mousePosition);
            return new Vector2Int(Mathf.FloorToInt(mouseWorld.x), Mathf.FloorToInt(mouseWorld.y));
        }

        public static bool IsInWorldBounds(int worldX, int worldY)
        {
            return worldX >= 0 && worldX < Constants.WorldWidth &&
                   worldY >= 0 && worldY < Constants.WorldHeight;
        }

        public static float Distance(Vector2Int a, Vector2Int b)
        {
            return Vector2.Distance(new Vector2(a.x, a.y), new Vector2(b.x, b.y));
        }
    }
}
