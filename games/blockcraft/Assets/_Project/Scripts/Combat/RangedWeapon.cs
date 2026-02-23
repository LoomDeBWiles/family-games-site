using UnityEngine;

namespace BlockCraft
{
    /// <summary>
    /// Component for ranged weapon behavior. Handles aiming visuals.
    /// Actual projectile spawning is in PlayerCombat.
    /// </summary>
    public class RangedWeapon : MonoBehaviour
    {
        [SerializeField] private float aimLineLength = 3f;
        [SerializeField] private LineRenderer aimLine;

        private Camera _cam;
        private bool _isAiming;

        private void Start()
        {
            _cam = Camera.main;

            if (aimLine == null)
            {
                aimLine = gameObject.AddComponent<LineRenderer>();
                aimLine.positionCount = 2;
                aimLine.startWidth = 0.02f;
                aimLine.endWidth = 0.02f;
                aimLine.material = new Material(Shader.Find("Sprites/Default"));
                aimLine.startColor = new Color(1, 1, 1, 0.3f);
                aimLine.endColor = new Color(1, 1, 1, 0.1f);
                aimLine.enabled = false;
            }
        }

        private void Update()
        {
            // Show aim line when holding right weapon
            var selected = InventoryManager.Instance?.SelectedSlot;
            _isAiming = selected != null && !selected.IsEmpty && selected.Item.toolType == ToolType.Bow;

            if (_isAiming && _cam != null)
            {
                aimLine.enabled = true;
                Vector3 mouseWorld = _cam.ScreenToWorldPoint(Input.mousePosition);
                mouseWorld.z = 0;
                Vector2 dir = ((Vector2)mouseWorld - (Vector2)transform.position).normalized;

                aimLine.SetPosition(0, transform.position);
                aimLine.SetPosition(1, (Vector2)transform.position + dir * aimLineLength);
            }
            else
            {
                if (aimLine != null)
                    aimLine.enabled = false;
            }
        }
    }
}
