using UnityEngine;
using UnityEngine.Rendering;

namespace BlockCraft
{
    /// <summary>
    /// Simple lighting system using Unity's global light and per-tile light sources.
    /// For a 2D game, we use a full-screen overlay that darkens at night,
    /// and torch tiles punch through the darkness.
    /// </summary>
    public class LightingSystem : MonoBehaviour
    {
        public static LightingSystem Instance { get; private set; }

        [SerializeField] private Color nightOverlayColor = new Color(0, 0, 0.05f, 0.85f);
        [SerializeField] private Color dayOverlayColor = new Color(0, 0, 0, 0);

        private SpriteRenderer _overlayRenderer;
        private Material _lightMaterial;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Start()
        {
            CreateOverlay();
        }

        private void CreateOverlay()
        {
            var overlayGO = new GameObject("LightOverlay");
            overlayGO.transform.SetParent(transform);
            _overlayRenderer = overlayGO.AddComponent<SpriteRenderer>();
            _overlayRenderer.sortingOrder = 90; // Above tiles, below UI

            var tex = new Texture2D(1, 1);
            tex.SetPixel(0, 0, Color.white);
            tex.Apply();
            _overlayRenderer.sprite = Sprite.Create(tex, new Rect(0, 0, 1, 1), new Vector2(0.5f, 0.5f), 1f);
            overlayGO.transform.localScale = new Vector3(500, 500, 1);
        }

        private void Update()
        {
            if (TimeManager.Instance == null || _overlayRenderer == null) return;

            float lightLevel = TimeManager.Instance.GetAmbientLightLevel();
            Color overlayColor = Color.Lerp(nightOverlayColor, dayOverlayColor, lightLevel);
            _overlayRenderer.color = overlayColor;

            // Follow camera
            var cam = Camera.main;
            if (cam != null)
            {
                _overlayRenderer.transform.position = new Vector3(
                    cam.transform.position.x,
                    cam.transform.position.y,
                    -5 // In front of tiles
                );
            }
        }

        /// <summary>
        /// Returns light level at a specific tile position (0-1).
        /// Takes into account time of day and nearby light sources.
        /// </summary>
        public float GetLightAt(int worldX, int worldY)
        {
            if (TimeManager.Instance == null) return 1f;

            float ambient = TimeManager.Instance.GetAmbientLightLevel();

            // Check for nearby torch tiles
            float torchLight = 0f;
            int searchRadius = 8;

            for (int dx = -searchRadius; dx <= searchRadius; dx++)
            {
                for (int dy = -searchRadius; dy <= searchRadius; dy++)
                {
                    int tx = worldX + dx;
                    int ty = worldY + dy;

                    if (!TileHelper.IsInWorldBounds(tx, ty)) continue;

                    TileID tile = WorldManager.Instance.GetTile(tx, ty);
                    if (tile == TileID.Torch)
                    {
                        float dist = Mathf.Sqrt(dx * dx + dy * dy);
                        float falloff = 1f - (dist / searchRadius);
                        torchLight = Mathf.Max(torchLight, Mathf.Max(0, falloff));
                    }
                }
            }

            return Mathf.Clamp01(Mathf.Max(ambient, torchLight));
        }
    }
}
