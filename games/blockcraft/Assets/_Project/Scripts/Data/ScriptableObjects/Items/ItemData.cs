using UnityEngine;

namespace BlockCraft
{
    [CreateAssetMenu(fileName = "NewItem", menuName = "BlockCraft/Item Data")]
    public class ItemData : ScriptableObject
    {
        [Header("Identity")]
        public int itemID;
        public string displayName;
        public Sprite icon;

        [Header("Stacking")]
        public int maxStackSize = 64;

        [Header("Category")]
        public ItemCategory category = ItemCategory.Material;

        [Header("Block Placement")]
        public TileID placesBlock = TileID.Air;

        [Header("Tool Properties")]
        public ToolType toolType = ToolType.None;
        public int toolTier = 0;           // 0=hand, 1=wood, 2=stone, 3=iron, 4=gold, 5=diamond
        public float toolPower = 1f;       // Mining speed multiplier

        [Header("Weapon Properties")]
        public float attackDamage = 1f;
        public float attackSpeed = 1f;     // Attacks per second
        public float attackRange = 1.5f;
        public float knockback = 2f;

        [Header("Durability")]
        public int maxDurability = 0;      // 0 = no durability

        [Header("Consumable")]
        public float healthRestore = 0f;
        public float hungerRestore = 0f;

        [Header("Visuals")]
        public Sprite worldSprite;         // For dropped item entity
        public RuntimeAnimatorController animatorOverride;

        public bool IsStackable => maxStackSize > 1;
        public bool IsTool => category == ItemCategory.Tool;
        public bool IsWeapon => category == ItemCategory.Weapon;
        public bool IsBlock => category == ItemCategory.Block;
        public bool IsConsumable => category == ItemCategory.Consumable;
        public bool HasDurability => maxDurability > 0;
    }
}
