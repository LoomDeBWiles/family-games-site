using System;

namespace BlockCraft
{
    [Serializable]
    public class InventorySlot
    {
        public ItemData Item;
        public int Count;
        public int Durability;

        public bool IsEmpty => Item == null || Count <= 0;

        public InventorySlot()
        {
            Item = null;
            Count = 0;
            Durability = 0;
        }

        public InventorySlot(ItemData item, int count)
        {
            Item = item;
            Count = count;
            Durability = item != null ? item.maxDurability : 0;
        }

        public void Clear()
        {
            Item = null;
            Count = 0;
            Durability = 0;
        }

        public void Set(ItemData item, int count)
        {
            Item = item;
            Count = count;
            Durability = item != null ? item.maxDurability : 0;
        }

        public int AddToStack(int amount)
        {
            if (Item == null) return amount;
            int canAdd = Item.maxStackSize - Count;
            int toAdd = Math.Min(amount, canAdd);
            Count += toAdd;
            return amount - toAdd; // remainder
        }

        public InventorySlot Split()
        {
            if (IsEmpty || Count <= 1) return new InventorySlot();
            int half = Count / 2;
            Count -= half;
            return new InventorySlot(Item, half);
        }

        public bool CanMergeWith(InventorySlot other)
        {
            if (IsEmpty || other.IsEmpty) return false;
            return Item == other.Item && Item.IsStackable && Count < Item.maxStackSize;
        }

        public InventorySlot Clone()
        {
            var clone = new InventorySlot();
            clone.Item = Item;
            clone.Count = Count;
            clone.Durability = Durability;
            return clone;
        }

        public bool UseDurability(int amount = 1)
        {
            if (Item == null || !Item.HasDurability) return false;
            Durability -= amount;
            if (Durability <= 0)
            {
                Clear();
                return true; // item broke
            }
            return false;
        }
    }
}
