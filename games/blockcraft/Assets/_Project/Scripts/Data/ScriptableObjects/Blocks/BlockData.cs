using UnityEngine;
using UnityEngine.Tilemaps;

namespace BlockCraft
{
    [CreateAssetMenu(fileName = "NewBlock", menuName = "BlockCraft/Block Data")]
    public class BlockData : ScriptableObject
    {
        [Header("Identity")]
        public TileID tileID;
        public string displayName;

        [Header("Visuals")]
        public Sprite sprite;
        public TileBase tileAsset; // Unity Tile for Tilemap rendering
        public Color mapColor = Color.gray;

        [Header("Properties")]
        public float hardness = 1f;         // Time multiplier for mining
        public int minToolTier = 0;          // 0=hand, 1=wood, 2=stone, 3=iron, 4=gold, 5=diamond
        public ToolType requiredToolType = ToolType.None;
        public bool isSolid = true;
        public bool isTransparent = false;
        public int lightEmission = 0;        // 0-15

        [Header("Drops")]
        public ItemData dropItem;
        public int dropCount = 1;

        [Header("Audio")]
        public AudioClip breakSound;
        public AudioClip placeSound;
    }
}
