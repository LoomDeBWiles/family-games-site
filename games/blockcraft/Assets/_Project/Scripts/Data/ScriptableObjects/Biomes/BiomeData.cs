using UnityEngine;

namespace BlockCraft
{
    [CreateAssetMenu(fileName = "NewBiome", menuName = "BlockCraft/Biome Data")]
    public class BiomeData : ScriptableObject
    {
        [Header("Identity")]
        public string biomeName;

        [Header("Terrain")]
        public TileID surfaceBlock = TileID.Grass;
        public TileID subsurfaceBlock = TileID.Dirt;
        public int subsurfaceDepth = 5;
        public float terrainAmplitude = 15f;    // Height variation
        public float terrainFrequency = 0.03f;  // Noise scale

        [Header("Features")]
        public float treeChance = 0.05f;
        public int treeMinHeight = 4;
        public int treeMaxHeight = 7;
        public TileID treeBlock = TileID.Wood;
        public TileID leafBlock = TileID.Leaves;

        [Header("Ores")]
        public bool hasCoal = true;
        public bool hasIron = true;
        public bool hasGold = true;
        public bool hasDiamond = true;

        [Header("Visuals")]
        public Color skyColor = new Color(0.53f, 0.81f, 0.92f);
        public Color fogColor = new Color(0.7f, 0.85f, 0.95f);

        [Header("Spawning")]
        public EnemyData[] spawnableEnemies;
        public float enemySpawnMultiplier = 1f;
    }
}
