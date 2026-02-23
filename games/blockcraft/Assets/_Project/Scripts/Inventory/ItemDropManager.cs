using UnityEngine;

namespace BlockCraft
{
    public class ItemDropManager : MonoBehaviour
    {
        public static ItemDropManager Instance { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        public void DropItem(ItemData item, int count, Vector2 position)
        {
            if (item == null || count <= 0) return;

            // Split into individual stacks if needed
            while (count > 0)
            {
                int dropAmount = Mathf.Min(count, item.maxStackSize);
                ItemEntity.SpawnDrop(item, dropAmount, position);
                count -= dropAmount;
            }
        }

        public void DropPlayerInventory(Vector2 position)
        {
            if (InventoryManager.Instance == null) return;

            var slots = InventoryManager.Instance.GetAllSlots();
            foreach (var slot in slots)
            {
                if (slot != null && !slot.IsEmpty)
                {
                    DropItem(slot.Item, slot.Count, position);
                    slot.Clear();
                }
            }
        }
    }
}
