using UnityEngine;

namespace BlockCraft
{
    public class HotbarController : MonoBehaviour
    {
        private void Update()
        {
            if (InventoryManager.Instance == null) return;

            // Number keys 1-9, 0
            for (int i = 0; i < Constants.HotbarSize; i++)
            {
                KeyCode key = i < 9 ? KeyCode.Alpha1 + i : KeyCode.Alpha0;
                if (Input.GetKeyDown(key))
                {
                    InventoryManager.Instance.SelectHotbarSlot(i);
                    return;
                }
            }

            // Scroll wheel
            float scroll = Input.GetAxis("Mouse ScrollWheel");
            if (scroll != 0)
            {
                int current = InventoryManager.Instance.SelectedHotbarIndex;
                if (scroll > 0)
                    current = (current - 1 + Constants.HotbarSize) % Constants.HotbarSize;
                else
                    current = (current + 1) % Constants.HotbarSize;

                InventoryManager.Instance.SelectHotbarSlot(current);
            }
        }
    }
}
