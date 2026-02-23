using System;
using System.IO;
using System.Runtime.Serialization.Formatters.Binary;
using UnityEngine;

namespace BlockCraft
{
    public class SaveSystem : MonoBehaviour
    {
        public static SaveSystem Instance { get; private set; }

        private const string SaveFolder = "Saves";
        private const string WorldFile = "world.dat";
        private const string PlayerFile = "player.dat";

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private string GetSavePath(string worldName)
        {
            string path = Path.Combine(Application.persistentDataPath, SaveFolder, worldName);
            Directory.CreateDirectory(path);
            return path;
        }

        public void SaveWorld(string worldName)
        {
            try
            {
                string savePath = GetSavePath(worldName);

                // Save world data
                WorldSaveData worldData = new WorldSaveData();
                worldData.seed = WorldManager.Instance.Seed;
                worldData.dayCount = TimeManager.Instance != null ? TimeManager.Instance.DayCount : 1;
                worldData.timeOfDay = TimeManager.Instance != null ? TimeManager.Instance.NormalizedTime : 0.3f;

                // Save loaded chunk tile data
                var chunks = WorldManager.Instance.GetLoadedChunks();
                worldData.chunkCount = chunks.Count;
                worldData.chunkKeys = new int[chunks.Count * 2];
                worldData.chunkTiles = new ushort[chunks.Count][];

                int i = 0;
                foreach (var kvp in chunks)
                {
                    worldData.chunkKeys[i * 2] = kvp.Key.x;
                    worldData.chunkKeys[i * 2 + 1] = kvp.Key.y;

                    var tiles = new ushort[Constants.ChunkWidth * Constants.ChunkHeight];
                    for (int x = 0; x < Constants.ChunkWidth; x++)
                    {
                        for (int y = 0; y < Constants.ChunkHeight; y++)
                        {
                            tiles[x * Constants.ChunkHeight + y] = (ushort)kvp.Value.Tiles[x, y];
                        }
                    }
                    worldData.chunkTiles[i] = tiles;
                    i++;
                }

                SerializeToFile(Path.Combine(savePath, WorldFile), worldData);

                // Save player data
                PlayerSaveData playerData = new PlayerSaveData();
                if (PlayerController.Instance != null)
                {
                    playerData.posX = PlayerController.Instance.transform.position.x;
                    playerData.posY = PlayerController.Instance.transform.position.y;
                }
                if (PlayerStats.Instance != null)
                {
                    playerData.health = PlayerStats.Instance.Health;
                    playerData.hunger = PlayerStats.Instance.Hunger;
                }

                // Save inventory
                if (InventoryManager.Instance != null)
                {
                    var slots = InventoryManager.Instance.GetAllSlots();
                    playerData.inventoryItemIDs = new int[slots.Length];
                    playerData.inventoryCounts = new int[slots.Length];
                    playerData.inventoryDurabilities = new int[slots.Length];

                    for (int s = 0; s < slots.Length; s++)
                    {
                        if (slots[s] != null && !slots[s].IsEmpty)
                        {
                            playerData.inventoryItemIDs[s] = slots[s].Item.itemID;
                            playerData.inventoryCounts[s] = slots[s].Count;
                            playerData.inventoryDurabilities[s] = slots[s].Durability;
                        }
                        else
                        {
                            playerData.inventoryItemIDs[s] = -1;
                            playerData.inventoryCounts[s] = 0;
                            playerData.inventoryDurabilities[s] = 0;
                        }
                    }
                }

                SerializeToFile(Path.Combine(savePath, PlayerFile), playerData);

                Debug.Log($"[SaveSystem] World '{worldName}' saved successfully.");
            }
            catch (Exception e)
            {
                Debug.LogError($"[SaveSystem] Failed to save: {e.Message}");
            }
        }

        public bool LoadWorld(string worldName)
        {
            try
            {
                string savePath = GetSavePath(worldName);
                string worldFilePath = Path.Combine(savePath, WorldFile);
                string playerFilePath = Path.Combine(savePath, PlayerFile);

                if (!File.Exists(worldFilePath))
                {
                    Debug.LogWarning($"[SaveSystem] No save found for '{worldName}'");
                    return false;
                }

                WorldSaveData worldData = DeserializeFromFile<WorldSaveData>(worldFilePath);

                // Initialize world with saved seed
                WorldManager.Instance.InitializeWorld(worldData.seed);

                // Set time
                if (TimeManager.Instance != null)
                    TimeManager.Instance.SetTime(worldData.timeOfDay);

                // Load player data if available
                if (File.Exists(playerFilePath))
                {
                    PlayerSaveData playerData = DeserializeFromFile<PlayerSaveData>(playerFilePath);

                    Vector2 playerPos = new Vector2(playerData.posX, playerData.posY);
                    WorldManager.Instance.GenerateInitialChunks(playerPos);

                    // Restore chunk modifications
                    for (int c = 0; c < worldData.chunkCount; c++)
                    {
                        int cx = worldData.chunkKeys[c * 2];
                        int cy = worldData.chunkKeys[c * 2 + 1];
                        var chunk = WorldManager.Instance.GetChunk(new Vector2Int(cx, cy));

                        if (chunk != null && worldData.chunkTiles[c] != null)
                        {
                            for (int x = 0; x < Constants.ChunkWidth; x++)
                            {
                                for (int y = 0; y < Constants.ChunkHeight; y++)
                                {
                                    chunk.Tiles[x, y] = (TileID)worldData.chunkTiles[c][x * Constants.ChunkHeight + y];
                                }
                            }
                            chunk.RefreshVisuals();
                        }
                    }

                    // Restore player stats
                    if (PlayerStats.Instance != null)
                    {
                        PlayerStats.Instance.Heal(playerData.health - PlayerStats.Instance.Health);
                        PlayerStats.Instance.Feed(playerData.hunger - PlayerStats.Instance.Hunger);
                    }

                    // TODO: Restore inventory items by ID lookup
                }

                Debug.Log($"[SaveSystem] World '{worldName}' loaded successfully.");
                return true;
            }
            catch (Exception e)
            {
                Debug.LogError($"[SaveSystem] Failed to load: {e.Message}");
                return false;
            }
        }

        public bool SaveExists(string worldName)
        {
            string path = Path.Combine(Application.persistentDataPath, SaveFolder, worldName, WorldFile);
            return File.Exists(path);
        }

        public string[] GetSavedWorlds()
        {
            string folder = Path.Combine(Application.persistentDataPath, SaveFolder);
            if (!Directory.Exists(folder)) return new string[0];
            return Directory.GetDirectories(folder);
        }

        public void DeleteSave(string worldName)
        {
            string path = Path.Combine(Application.persistentDataPath, SaveFolder, worldName);
            if (Directory.Exists(path))
                Directory.Delete(path, true);
        }

        private void SerializeToFile(string path, object data)
        {
            BinaryFormatter bf = new BinaryFormatter();
            using (FileStream fs = File.Create(path))
            {
                bf.Serialize(fs, data);
            }
        }

        private T DeserializeFromFile<T>(string path)
        {
            BinaryFormatter bf = new BinaryFormatter();
            using (FileStream fs = File.Open(path, FileMode.Open))
            {
                return (T)bf.Deserialize(fs);
            }
        }
    }

    [Serializable]
    public class WorldSaveData
    {
        public int seed;
        public int dayCount;
        public float timeOfDay;
        public int chunkCount;
        public int[] chunkKeys;    // [cx0, cy0, cx1, cy1, ...]
        public ushort[][] chunkTiles;
    }

    [Serializable]
    public class PlayerSaveData
    {
        public float posX;
        public float posY;
        public float health;
        public float hunger;
        public int[] inventoryItemIDs;
        public int[] inventoryCounts;
        public int[] inventoryDurabilities;
    }
}
