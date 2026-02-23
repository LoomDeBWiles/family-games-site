using UnityEngine;

namespace BlockCraft
{
    [CreateAssetMenu(fileName = "NewRecipe", menuName = "BlockCraft/Crafting Recipe")]
    public class CraftingRecipe : ScriptableObject
    {
        [Header("Recipe Info")]
        public string recipeName;
        public CraftingStationType requiredStation = CraftingStationType.None;

        [Header("Ingredients")]
        public Ingredient[] ingredients;

        [Header("Result")]
        public ItemData resultItem;
        public int resultCount = 1;

        [System.Serializable]
        public struct Ingredient
        {
            public ItemData item;
            public int count;
        }

        public bool CanCraft(InventoryManager inventory)
        {
            if (inventory == null) return false;

            foreach (var ingredient in ingredients)
            {
                if (!inventory.HasItem(ingredient.item, ingredient.count))
                    return false;
            }
            return true;
        }

        public bool Craft(InventoryManager inventory)
        {
            if (!CanCraft(inventory)) return false;

            // Remove ingredients
            foreach (var ingredient in ingredients)
            {
                inventory.RemoveItem(ingredient.item, ingredient.count);
            }

            // Add result
            int leftover = inventory.AddItem(resultItem, resultCount);
            if (leftover > 0)
            {
                Debug.LogWarning($"Crafting overflow: {leftover} {resultItem.displayName} couldn't fit.");
                // TODO: drop as item entity
            }

            return true;
        }
    }
}
