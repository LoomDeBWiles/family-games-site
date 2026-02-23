using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace BlockCraft
{
    public class HUDController : MonoBehaviour
    {
        public static HUDController Instance { get; private set; }

        [SerializeField] private HealthBar healthBar;
        [SerializeField] private HungerBar hungerBar;
        [SerializeField] private HotbarUI hotbarUI;
        [SerializeField] private TextMeshProUGUI dayTimeText;
        [SerializeField] private GameObject deathScreen;
        [SerializeField] private TextMeshProUGUI deathText;

        private Canvas _canvas;

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
            CreateHUD();

            if (PlayerStats.Instance != null)
                PlayerStats.Instance.OnDeath += ShowDeathScreen;
        }

        private void OnDestroy()
        {
            if (PlayerStats.Instance != null)
                PlayerStats.Instance.OnDeath -= ShowDeathScreen;
        }

        private void CreateHUD()
        {
            // Ensure canvas exists
            _canvas = GetComponent<Canvas>();
            if (_canvas == null)
            {
                _canvas = gameObject.AddComponent<Canvas>();
                _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
                _canvas.sortingOrder = 100;
                gameObject.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
                GetComponent<CanvasScaler>().referenceResolution = new Vector2(1920, 1080);
                gameObject.AddComponent<GraphicRaycaster>();
            }

            // Health bar (top-left)
            if (healthBar == null)
            {
                var hbGO = new GameObject("HealthBar");
                hbGO.transform.SetParent(transform, false);
                var hbRT = hbGO.AddComponent<RectTransform>();
                hbRT.anchorMin = new Vector2(0, 1);
                hbRT.anchorMax = new Vector2(0, 1);
                hbRT.pivot = new Vector2(0, 1);
                hbRT.anchoredPosition = new Vector2(20, -20);
                hbRT.sizeDelta = new Vector2(200, 25);
                healthBar = hbGO.AddComponent<HealthBar>();
            }

            // Hunger bar (below health)
            if (hungerBar == null)
            {
                var hubGO = new GameObject("HungerBar");
                hubGO.transform.SetParent(transform, false);
                var hubRT = hubGO.AddComponent<RectTransform>();
                hubRT.anchorMin = new Vector2(0, 1);
                hubRT.anchorMax = new Vector2(0, 1);
                hubRT.pivot = new Vector2(0, 1);
                hubRT.anchoredPosition = new Vector2(20, -50);
                hubRT.sizeDelta = new Vector2(200, 25);
                hungerBar = hubGO.AddComponent<HungerBar>();
            }

            // Day/Time text (top-right)
            if (dayTimeText == null)
            {
                var dtGO = new GameObject("DayTimeText");
                dtGO.transform.SetParent(transform, false);
                var dtRT = dtGO.AddComponent<RectTransform>();
                dtRT.anchorMin = new Vector2(1, 1);
                dtRT.anchorMax = new Vector2(1, 1);
                dtRT.pivot = new Vector2(1, 1);
                dtRT.anchoredPosition = new Vector2(-20, -20);
                dtRT.sizeDelta = new Vector2(200, 30);
                dayTimeText = dtGO.AddComponent<TextMeshProUGUI>();
                dayTimeText.fontSize = 16;
                dayTimeText.alignment = TextAlignmentOptions.TopRight;
                dayTimeText.color = Color.white;
            }

            // Hotbar (bottom-center)
            if (hotbarUI == null)
            {
                var hbUIGO = new GameObject("HotbarUI");
                hbUIGO.transform.SetParent(transform, false);
                var hbUIRT = hbUIGO.AddComponent<RectTransform>();
                hbUIRT.anchorMin = new Vector2(0.5f, 0);
                hbUIRT.anchorMax = new Vector2(0.5f, 0);
                hbUIRT.pivot = new Vector2(0.5f, 0);
                hbUIRT.anchoredPosition = new Vector2(0, 10);
                hbUIRT.sizeDelta = new Vector2(540, 54);

                var hlg = hbUIGO.AddComponent<HorizontalLayoutGroup>();
                hlg.spacing = 4;
                hlg.childForceExpandWidth = false;
                hlg.childForceExpandHeight = false;
                hlg.childAlignment = TextAnchor.MiddleCenter;

                hotbarUI = hbUIGO.AddComponent<HotbarUI>();
            }

            // Death screen (hidden)
            if (deathScreen == null)
            {
                deathScreen = new GameObject("DeathScreen");
                deathScreen.transform.SetParent(transform, false);
                var dsRT = deathScreen.AddComponent<RectTransform>();
                dsRT.anchorMin = Vector2.zero;
                dsRT.anchorMax = Vector2.one;
                dsRT.sizeDelta = Vector2.zero;

                var dsBG = deathScreen.AddComponent<Image>();
                dsBG.color = new Color(0.5f, 0, 0, 0.7f);

                var textGO = new GameObject("DeathText");
                textGO.transform.SetParent(deathScreen.transform, false);
                var textRT = textGO.AddComponent<RectTransform>();
                textRT.anchorMin = new Vector2(0.5f, 0.5f);
                textRT.anchorMax = new Vector2(0.5f, 0.5f);
                textRT.sizeDelta = new Vector2(400, 100);
                deathText = textGO.AddComponent<TextMeshProUGUI>();
                deathText.fontSize = 36;
                deathText.alignment = TextAlignmentOptions.Center;
                deathText.color = Color.white;
                deathText.text = "YOU DIED\n<size=18>Respawning...</size>";

                deathScreen.SetActive(false);
            }
        }

        private void Update()
        {
            if (TimeManager.Instance != null && dayTimeText != null)
            {
                string period = "Day";
                if (TimeManager.Instance.IsNight) period = "Night";
                else if (TimeManager.Instance.IsDusk) period = "Dusk";
                else if (TimeManager.Instance.IsDawn) period = "Dawn";

                dayTimeText.text = $"Day {TimeManager.Instance.DayCount} - {period}";
            }
        }

        public void ShowDeathScreen()
        {
            if (deathScreen != null)
            {
                deathScreen.SetActive(true);
                Invoke(nameof(HideDeathScreen), 3f);
            }
        }

        private void HideDeathScreen()
        {
            if (deathScreen != null)
                deathScreen.SetActive(false);
        }
    }
}
