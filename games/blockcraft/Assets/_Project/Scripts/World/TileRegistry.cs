using System.Collections.Generic;
using UnityEngine;

namespace BlockCraft
{
    public class TileRegistry : MonoBehaviour
    {
        public static TileRegistry Instance { get; private set; }

        [SerializeField] private BlockData[] blockDataAssets;

        private Dictionary<TileID, BlockData> _blockLookup = new Dictionary<TileID, BlockData>();

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;

            BuildLookup();
        }

        private void BuildLookup()
        {
            _blockLookup.Clear();
            if (blockDataAssets == null) return;

            foreach (var data in blockDataAssets)
            {
                if (data != null && !_blockLookup.ContainsKey(data.tileID))
                {
                    _blockLookup[data.tileID] = data;
                }
            }
        }

        public BlockData GetBlockData(TileID id)
        {
            _blockLookup.TryGetValue(id, out BlockData data);
            return data;
        }

        public bool IsSolid(TileID id)
        {
            if (id == TileID.Air) return false;
            var data = GetBlockData(id);
            return data != null && data.isSolid;
        }

        public float GetHardness(TileID id)
        {
            var data = GetBlockData(id);
            return data != null ? data.hardness : 1f;
        }
    }
}
