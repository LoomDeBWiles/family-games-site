using UnityEngine;

namespace BlockCraft
{
    public class CraftingManager : MonoBehaviour
    {
        public static CraftingManager Instance { get; private set; }

        [SerializeField] private CraftingUI craftingUI;

        private CraftingStationType _currentStation = CraftingStationType.None;
        private bool _isOpen;

        public CraftingStationType CurrentStation => _currentStation;
        public bool IsOpen => _isOpen;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Update()
        {
            // Close crafting with Escape or E
            if (_isOpen && (Input.GetKeyDown(KeyCode.Escape) || Input.GetKeyDown(KeyCode.E)))
            {
                CloseCraftingUI();
            }
        }

        public void OpenCraftingUI(CraftingStationType station)
        {
            _currentStation = station;
            _isOpen = true;

            if (craftingUI == null)
                craftingUI = FindFirstObjectByType<CraftingUI>();

            if (craftingUI != null)
                craftingUI.Open(station);

            // Also open inventory
            InventoryUI.Instance?.Open();
        }

        public void CloseCraftingUI()
        {
            _isOpen = false;
            if (craftingUI != null)
                craftingUI.Close();
            InventoryUI.Instance?.Close();
        }

        public bool TryCraft(CraftingRecipe recipe)
        {
            if (recipe == null || InventoryManager.Instance == null) return false;

            // Verify station requirement
            if (recipe.requiredStation != CraftingStationType.None &&
                recipe.requiredStation != _currentStation)
            {
                Debug.Log($"Need {recipe.requiredStation} to craft {recipe.recipeName}");
                return false;
            }

            bool success = recipe.Craft(InventoryManager.Instance);
            if (success)
            {
                Debug.Log($"Crafted: {recipe.resultCount}x {recipe.resultItem.displayName}");
                craftingUI?.RefreshRecipes();
            }

            return success;
        }
    }
}
