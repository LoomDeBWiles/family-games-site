using System.Collections.Generic;
using UnityEngine;

namespace BlockCraft
{
    public class RecipeRegistry : MonoBehaviour
    {
        public static RecipeRegistry Instance { get; private set; }

        [SerializeField] private CraftingRecipe[] allRecipes;

        private Dictionary<CraftingStationType, List<CraftingRecipe>> _recipesByStation;

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
            _recipesByStation = new Dictionary<CraftingStationType, List<CraftingRecipe>>();

            foreach (CraftingStationType station in System.Enum.GetValues(typeof(CraftingStationType)))
            {
                _recipesByStation[station] = new List<CraftingRecipe>();
            }

            if (allRecipes == null) return;

            foreach (var recipe in allRecipes)
            {
                if (recipe != null)
                {
                    _recipesByStation[recipe.requiredStation].Add(recipe);
                }
            }
        }

        public List<CraftingRecipe> GetRecipesForStation(CraftingStationType station)
        {
            // Return hand crafting recipes + station-specific recipes
            var recipes = new List<CraftingRecipe>();

            if (_recipesByStation.TryGetValue(CraftingStationType.None, out var handRecipes))
                recipes.AddRange(handRecipes);

            if (station != CraftingStationType.None && _recipesByStation.TryGetValue(station, out var stationRecipes))
                recipes.AddRange(stationRecipes);

            return recipes;
        }

        public List<CraftingRecipe> GetAvailableRecipes(CraftingStationType station, InventoryManager inventory)
        {
            var all = GetRecipesForStation(station);
            var available = new List<CraftingRecipe>();

            foreach (var recipe in all)
            {
                if (recipe.CanCraft(inventory))
                    available.Add(recipe);
            }

            return available;
        }

        public CraftingRecipe[] GetAllRecipes() => allRecipes;
    }
}
