using System;
using UnityEngine;

namespace BlockCraft
{
    public class InventoryManager : MonoBehaviour
    {
        public static InventoryManager Instance { get; private set; }

        private InventorySlot[] _slots;
        private int _selectedHotbarIndex = 0;

        public event Action OnInventoryChanged;
        public event Action<int> OnHotbarSelectionChanged;

        public int SlotCount => Constants.TotalInventorySlots;
        public int SelectedHotbarIndex => _selectedHotbarIndex;

        public InventorySlot SelectedSlot =>
            _selectedHotbarIndex >= 0 && _selectedHotbarIndex < Constants.HotbarSize
                ? _slots[_selectedHotbarIndex]
                : null;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;

            _slots = new InventorySlot[Constants.TotalInventorySlots];
            for (int i = 0; i < _slots.Length; i++)
                _slots[i] = new InventorySlot();
        }

        public InventorySlot GetSlot(int index)
        {
            if (index < 0 || index >= _slots.Length) return null;
            return _slots[index];
        }

        public void SetSlot(int index, InventorySlot slot)
        {
            if (index < 0 || index >= _slots.Length) return;
            _slots[index] = slot ?? new InventorySlot();
            OnInventoryChanged?.Invoke();
        }

        /// <summary>
        /// Try to add an item to the inventory. Returns the leftover count that couldn't fit.
        /// </summary>
        public int AddItem(ItemData item, int count)
        {
            if (item == null || count <= 0) return 0;

            int remaining = count;

            // First, try to stack with existing slots
            if (item.IsStackable)
            {
                for (int i = 0; i < _slots.Length && remaining > 0; i++)
                {
                    if (!_slots[i].IsEmpty && _slots[i].Item == item && _slots[i].Count < item.maxStackSize)
                    {
                        remaining = _slots[i].AddToStack(remaining);
                    }
                }
            }

            // Then, fill empty slots
            for (int i = 0; i < _slots.Length && remaining > 0; i++)
            {
                if (_slots[i].IsEmpty)
                {
                    int toPlace = Mathf.Min(remaining, item.maxStackSize);
                    _slots[i].Set(item, toPlace);
                    remaining -= toPlace;
                }
            }

            OnInventoryChanged?.Invoke();
            return remaining;
        }

        /// <summary>
        /// Remove a specific count of an item. Returns how many were actually removed.
        /// </summary>
        public int RemoveItem(ItemData item, int count)
        {
            if (item == null || count <= 0) return 0;

            int toRemove = count;

            for (int i = _slots.Length - 1; i >= 0 && toRemove > 0; i--)
            {
                if (!_slots[i].IsEmpty && _slots[i].Item == item)
                {
                    int take = Mathf.Min(toRemove, _slots[i].Count);
                    _slots[i].Count -= take;
                    toRemove -= take;

                    if (_slots[i].Count <= 0)
                        _slots[i].Clear();
                }
            }

            OnInventoryChanged?.Invoke();
            return count - toRemove;
        }

        public bool HasItem(ItemData item, int count = 1)
        {
            if (item == null) return false;
            int total = 0;
            for (int i = 0; i < _slots.Length; i++)
            {
                if (!_slots[i].IsEmpty && _slots[i].Item == item)
                    total += _slots[i].Count;
            }
            return total >= count;
        }

        public int CountItem(ItemData item)
        {
            if (item == null) return 0;
            int total = 0;
            for (int i = 0; i < _slots.Length; i++)
            {
                if (!_slots[i].IsEmpty && _slots[i].Item == item)
                    total += _slots[i].Count;
            }
            return total;
        }

        public void SelectHotbarSlot(int index)
        {
            if (index < 0 || index >= Constants.HotbarSize) return;
            _selectedHotbarIndex = index;
            OnHotbarSelectionChanged?.Invoke(index);
        }

        public void SwapSlots(int indexA, int indexB)
        {
            if (indexA < 0 || indexA >= _slots.Length || indexB < 0 || indexB >= _slots.Length) return;
            if (indexA == indexB) return;

            // Try stacking first
            if (!_slots[indexA].IsEmpty && !_slots[indexB].IsEmpty &&
                _slots[indexA].Item == _slots[indexB].Item && _slots[indexA].Item.IsStackable)
            {
                int remaining = _slots[indexB].AddToStack(_slots[indexA].Count);
                if (remaining <= 0)
                    _slots[indexA].Clear();
                else
                    _slots[indexA].Count = remaining;
            }
            else
            {
                var temp = _slots[indexA];
                _slots[indexA] = _slots[indexB];
                _slots[indexB] = temp;
            }

            OnInventoryChanged?.Invoke();
        }

        /// <summary>
        /// Consume one durability from the selected tool. Returns true if the tool broke.
        /// </summary>
        public bool UseSelectedTool()
        {
            var slot = SelectedSlot;
            if (slot == null || slot.IsEmpty || !slot.Item.HasDurability) return false;
            bool broke = slot.UseDurability();
            OnInventoryChanged?.Invoke();
            return broke;
        }

        public void DropAllItems()
        {
            // Called on death
            for (int i = 0; i < _slots.Length; i++)
            {
                if (!_slots[i].IsEmpty)
                {
                    // TODO: spawn item entities in world
                    _slots[i].Clear();
                }
            }
            OnInventoryChanged?.Invoke();
        }

        public InventorySlot[] GetAllSlots() => _slots;
    }
}
