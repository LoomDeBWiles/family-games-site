using UnityEngine;

namespace BlockCraft
{
    public class CraftingStation : MonoBehaviour
    {
        [SerializeField] private CraftingStationType stationType = CraftingStationType.Workbench;

        public CraftingStationType StationType => stationType;

        // This component is placed on crafting station block entities if needed.
        // Primary interaction is handled through PlayerInteraction checking tile types.
    }
}
