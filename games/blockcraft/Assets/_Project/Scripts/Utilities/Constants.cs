namespace BlockCraft
{
    public static class Constants
    {
        // Chunk dimensions
        public const int ChunkWidth = 16;
        public const int ChunkHeight = 16;

        // World dimensions (in tiles)
        public const int WorldWidth = 4200;
        public const int WorldHeight = 1200;

        // World dimensions (in chunks)
        public const int WorldWidthInChunks = WorldWidth / ChunkWidth;   // 262
        public const int WorldHeightInChunks = WorldHeight / ChunkHeight; // 75

        // Terrain generation
        public const int SurfaceHeight = 400;       // Base surface Y level
        public const int DirtLayerDepth = 5;         // Dirt below grass before stone
        public const int BedrockLayer = 5;            // Bottom N rows are bedrock
        public const float TerrainScale = 0.03f;      // Perlin noise scale for terrain
        public const float CaveScale = 0.08f;         // Perlin noise scale for caves
        public const float CaveThreshold = 0.42f;     // Below this = cave
        public const float TreeChance = 0.05f;         // Per-surface-tile tree chance
        public const int TreeMinHeight = 4;
        public const int TreeMaxHeight = 7;
        public const float OreScale = 0.1f;
        public const float CoalThreshold = 0.7f;
        public const float IronThreshold = 0.75f;
        public const float GoldThreshold = 0.8f;
        public const float DiamondThreshold = 0.85f;
        public const int IronMinDepth = 200;          // Depth below surface
        public const int GoldMinDepth = 400;
        public const int DiamondMinDepth = 600;

        // Player
        public const float PlayerMoveSpeed = 8f;
        public const float PlayerJumpForce = 14f;
        public const float PlayerMaxHealth = 100f;
        public const float PlayerMaxHunger = 100f;
        public const float HungerDrainRate = 0.5f;    // Per second
        public const float StarvationDamage = 1f;      // Per second when hunger=0

        // Inventory
        public const int HotbarSize = 10;
        public const int InventoryRows = 4;
        public const int InventoryCols = 10;
        public const int TotalInventorySlots = InventoryRows * InventoryCols; // 40 (10 hotbar + 30 backpack)

        // Rendering
        public const int ViewDistanceInChunks = 6;     // Load chunks within this radius
        public const float PixelsPerUnit = 16f;

        // Day/Night Cycle
        public const float DayDurationSeconds = 600f;  // 10 minutes
        public const float DawnStart = 0.2f;            // Normalized time
        public const float DayStart = 0.3f;
        public const float DuskStart = 0.7f;
        public const float NightStart = 0.8f;

        // Combat
        public const int MaxActiveEnemies = 10;
        public const float EnemySpawnInterval = 5f;
        public const float EnemyDespawnDistance = 60f;
        public const float PickupRadius = 1.5f;
        public const float DropMagnetRadius = 3f;

        // Mining
        public const float BaseMiningTime = 1.0f;
        public const float MiningRange = 5f;
        public const float PlacementRange = 5f;

        // Physics layers
        public const string PlayerLayer = "Player";
        public const string EnemyLayer = "Enemy";
        public const string GroundLayer = "Ground";
        public const string ItemLayer = "Item";
        public const string ProjectileLayer = "Projectile";
    }
}
