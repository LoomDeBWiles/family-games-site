using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace BlockCraft
{
    public class TooltipUI : MonoBehaviour
    {
        public static TooltipUI Instance { get; private set; }

        [SerializeField] private GameObject tooltipPanel;
        [SerializeField] private TextMeshProUGUI titleText;
        [SerializeField] private TextMeshProUGUI descriptionText;

        private RectTransform _panelRT;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            CreateUI();
            Hide();
        }

        private void CreateUI()
        {
            if (tooltipPanel != null) return;

            tooltipPanel = new GameObject("TooltipPanel");
            tooltipPanel.transform.SetParent(transform, false);

            _panelRT = tooltipPanel.AddComponent<RectTransform>();
            _panelRT.sizeDelta = new Vector2(200, 80);
            _panelRT.pivot = new Vector2(0, 1);

            var bg = tooltipPanel.AddComponent<Image>();
            bg.color = new Color(0.1f, 0.1f, 0.1f, 0.95f);
            bg.raycastTarget = false;

            var vlg = tooltipPanel.AddComponent<VerticalLayoutGroup>();
            vlg.padding = new RectOffset(8, 8, 6, 6);
            vlg.spacing = 4;
            vlg.childForceExpandWidth = true;
            vlg.childForceExpandHeight = false;

            var csf = tooltipPanel.AddComponent<ContentSizeFitter>();
            csf.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            csf.horizontalFit = ContentSizeFitter.FitMode.PreferredSize;

            // Title
            var titleGO = new GameObject("Title");
            titleGO.transform.SetParent(tooltipPanel.transform, false);
            titleText = titleGO.AddComponent<TextMeshProUGUI>();
            titleText.fontSize = 14;
            titleText.fontStyle = FontStyles.Bold;
            titleText.color = Color.white;
            titleText.raycastTarget = false;

            // Description
            var descGO = new GameObject("Description");
            descGO.transform.SetParent(tooltipPanel.transform, false);
            descriptionText = descGO.AddComponent<TextMeshProUGUI>();
            descriptionText.fontSize = 11;
            descriptionText.color = new Color(0.7f, 0.7f, 0.7f);
            descriptionText.raycastTarget = false;
        }

        public void Show(ItemData item, Vector2 position)
        {
            if (item == null || tooltipPanel == null) return;

            tooltipPanel.SetActive(true);
            titleText.text = item.displayName;

            // Build description
            string desc = "";
            if (item.IsTool)
                desc += $"Tool Tier: {item.toolTier}\nPower: {item.toolPower}x";
            if (item.IsWeapon)
                desc += $"Damage: {item.attackDamage}\nSpeed: {item.attackSpeed}";
            if (item.IsConsumable)
            {
                if (item.healthRestore > 0) desc += $"Heals: {item.healthRestore} HP\n";
                if (item.hungerRestore > 0) desc += $"Feeds: {item.hungerRestore}";
            }
            if (item.HasDurability)
                desc += $"\nDurability: {item.maxDurability}";

            descriptionText.text = desc;

            // Position near mouse
            if (_panelRT == null) _panelRT = tooltipPanel.GetComponent<RectTransform>();
            _panelRT.position = position + new Vector2(15, -15);
        }

        public void Hide()
        {
            if (tooltipPanel != null)
                tooltipPanel.SetActive(false);
        }

        private void Update()
        {
            if (tooltipPanel != null && tooltipPanel.activeSelf)
            {
                _panelRT.position = (Vector2)Input.mousePosition + new Vector2(15, -15);
            }
        }
    }
}
